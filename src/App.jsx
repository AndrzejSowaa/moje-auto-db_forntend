import { useState, useEffect } from 'react';
import Hero from './components/Hero';
import WatchCard from './components/WatchCard';

const API = 'https://moje-auto-api.onrender.com';

function App() {
  const [watches, setWatches] = useState([]);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [messageText, setMessageText] = useState('');
  
  // NOWE: Stany do obsługi walut
  const [currency, setCurrency] = useState('PLN');
  const [exchangeRates, setExchangeRates] = useState({});

  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [roleId, setRoleId] = useState(localStorage.getItem('roleId') ? Number(localStorage.getItem('roleId')) : null);
  const [myUserId, setMyUserId] = useState(localStorage.getItem('myUserId') ? Number(localStorage.getItem('myUserId')) : null);
  const [myEmail, setMyEmail] = useState(localStorage.getItem('myEmail') || null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  const [serverOffline, setServerOffline] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUsersAdmin, setShowUsersAdmin] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [roleConfirm, setRoleConfirm] = useState(null);
  
  const [newWatch, setNewWatch] = useState({ brand: '', model: '', price_pln: '', status: 'dostępny', image_url: '', description: '' });

  useEffect(() => {
    // NOWE: Pobieranie kursów walut z NBP (API darmowe i bezpieczne)
    fetch('https://api.nbp.pl/api/exchangerates/tables/A/?format=json')
      .then(res => res.json())
      .then(data => {
        const ratesArray = data[0].rates;
        const ratesMap = {};
        // Tworzymy wygodny obiekt słownikowy, np. { USD: 3.95, EUR: 4.25 }
        ratesArray.forEach(rate => { ratesMap[rate.code] = rate.mid; });
        setExchangeRates(ratesMap);
      })
      .catch(err => console.error('Błąd pobierania kursów NBP:', err));

    // Pobieranie zegarków z Twojego serwera
    fetch(`${API}/watches`)
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => { setWatches(data); setServerOffline(false); })
      .catch(() => setServerOffline(true));

    if (token) {
      fetch(`${API}/inquiries`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => { if (!res.ok) throw new Error(); return res.json(); })
        .then(setMessages).catch(handleLogout);

      if (roleId === 4) {
        fetch(`${API}/users`, { headers: { 'Authorization': `Bearer ${token}` } }).then(res => res.json()).then(setUsers);
      }
    }
  }, [token, roleId]);

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}${isLoginMode ? '/auth/login' : '/auth/register'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      
      if (res.ok && isLoginMode) {
        const decoded = JSON.parse(atob(data.token.split('.')[1]));
        localStorage.setItem('token', data.token); 
        localStorage.setItem('roleId', data.roleId);
        localStorage.setItem('myUserId', decoded.userId);
        localStorage.setItem('myEmail', decoded.email);
        
        setToken(data.token); setRoleId(data.roleId); setMyUserId(decoded.userId); setMyEmail(decoded.email);
        setEmail(''); setPassword('');
      } else if (res.ok) {
        setIsLoginMode(true);
      }
    } catch { setServerOffline(true); }
  };

  const handleLogout = () => { localStorage.clear(); setToken(null); setRoleId(null); setMyUserId(null); setMyEmail(null); setMessages([]); setUsers([]); setSelectedChatUser(null); };

  const executeRoleChange = async (userId, newRoleId) => {
    const res = await fetch(`${API}/users/${userId}/role`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ role_id: newRoleId })
    });
    if (res.ok) {
      const updatedUsersRes = await fetch(`${API}/users`, { headers: { 'Authorization': `Bearer ${token}` } });
      setUsers(await updatedUsersRes.json());
      setRoleConfirm(null);
    } else {
      const data = await res.json();
      alert(data.detail || "Błąd zmiany uprawnień");
      setRoleConfirm(null);
    }
  };

  const handleAddWatch = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API}/watches`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(newWatch)
    });
    if (res.ok) {
      setWatches([...watches, await res.json()]);
      setNewWatch({ brand: '', model: '', price_pln: '', status: 'dostępny', image_url: '', description: '' });
      setShowAddForm(false);
    }
  };

  const handleDeleteWatch = async (id) => {
    const res = await fetch(`${API}/watches/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setWatches(watches.filter(w => w.id !== id));
  };

  const handleEditFullWatch = async (id, updatedData) => {
    const res = await fetch(`${API}/watches/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
      body: JSON.stringify(updatedData)
    });
    if (res.ok) {
      const savedWatch = await res.json();
      setWatches(watches.map(w => w.id === id ? savedWatch : w));
    }
  };

  const handleSubmitMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    await fetch(`${API}/inquiries`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ watch_id: null, message: messageText }),
    });
    const res = await fetch(`${API}/inquiries`, { headers: { 'Authorization': `Bearer ${token}` } });
    setMessages(await res.json());
    setMessageText('');
  };

  const handleReplyFromInput = async (e, inquiry) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    const finalReply = inquiry.admin_reply ? `${inquiry.admin_reply}\n\n[Nowa wiadomość]: ${messageText}` : messageText;
    const res = await fetch(`${API}/inquiries/${inquiry.id}/reply`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ reply: finalReply })
    });
    if (res.ok) {
      const updatedInquiry = await res.json();
      setMessages(messages.map(m => m.id === inquiry.id ? updatedInquiry : m));
      setMessageText('');
    }
  };

  const groupedMessages = messages.reduce((acc, msg) => {
    if (!acc[msg.user_id]) acc[msg.user_id] = [];
    acc[msg.user_id].push(msg);
    return acc;
  }, {});
  const chatClients = Object.keys(groupedMessages);

  return (
    <div className="bg-black min-h-screen text-white">
      {serverOffline && (
        <div className="fixed top-0 w-full bg-yellow-600 text-white text-center py-2 z-[60] font-bold text-sm shadow-lg">
          ⚠️ Przepraszamy, trwa przerwa techniczna. Brak połączenia z serwerem.
        </div>
      )}

      <nav className={`fixed w-full z-50 p-8 flex justify-between items-center mix-blend-difference ${serverOffline ? 'top-8' : 'top-0'}`}>
        <div className="text-xl font-serif tracking-[0.2em]">HOROLOGY</div>
        <div className="hidden md:flex space-x-8 text-[9px] uppercase tracking-[0.4em] items-center">
          
          {/* NOWE: Przełącznik Walut z prawej strony */}
          <div className="flex items-center gap-2 border-r border-gray-600 pr-8">
            <span className="text-gray-400">WALUTA:</span>
            <select 
              value={currency} 
              onChange={e => setCurrency(e.target.value)} 
              className="bg-transparent border border-gold/50 text-gold px-2 py-1 rounded outline-none cursor-pointer hover:bg-white/10 transition-colors"
            >
              <option value="PLN" className="bg-black">PLN</option>
              <option value="EUR" className="bg-black">EUR</option>
              <option value="USD" className="bg-black">USD</option>
              <option value="GBP" className="bg-black">GBP</option>
              <option value="CHF" className="bg-black">CHF</option>
            </select>
          </div>

          {token && <span className="text-gray-400 border-r border-gray-600 pr-8">Zalogowano: {myEmail}</span>}
          {roleId === 4 && <span className="text-red-500 font-bold border border-red-500 px-2 py-1 rounded">Tryb Admina</span>}
          {roleId === 3 && <span className="text-blue-500 font-bold border border-blue-500 px-2 py-1 rounded">Tryb Menagera</span>}
          <a href="#kontakt" className="hover:text-gold transition">Kontakt</a>
          {token && <button onClick={handleLogout} className="text-red-400 font-bold">Wyloguj</button>}
        </div>
      </nav>

      <Hero />

      <div className="max-w-7xl mx-auto px-6 mt-20 flex gap-4">
        {roleId === 4 && (
          <button onClick={() => setShowUsersAdmin(!showUsersAdmin)} className="bg-red-900/50 text-red-300 border border-red-500/30 px-6 py-2 text-xs uppercase tracking-widest hover:bg-red-900 transition">
            {showUsersAdmin ? 'Ukryj panel użytkowników' : 'Zarządzaj użytkownikami'}
          </button>
        )}
        {roleId >= 3 && (
          <button onClick={() => setShowAddForm(!showAddForm)} className="bg-white/10 text-white border border-white/30 px-6 py-2 text-xs uppercase tracking-widest hover:bg-white/20 transition">
            {showAddForm ? 'Anuluj dodawanie' : '+ Dodaj nowy produkt'}
          </button>
        )}
      </div>

      {roleId === 4 && showUsersAdmin && (
        <section className="py-10 px-6 max-w-7xl mx-auto">
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] uppercase tracking-widest bg-black/60 text-gray-400">
                <tr><th className="px-6 py-4">ID</th><th className="px-6 py-4">Email</th><th className="px-6 py-4">Rola DB</th><th className="px-6 py-4 text-right">Zmień na:</th></tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-t border-white/5">
                    <td className="px-6 py-4">{user.id}</td>
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4 text-gray-400">{user.role_name === 'Manager' ? 'Menager' : user.role_name}</td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      {user.id === myUserId ? (
                        <span className="text-xs text-gray-500 italic px-3 py-1">Twoje konto (Blokada)</span>
                      ) : user.role_id === 4 ? (
                        <span className="text-xs text-red-500 font-bold italic px-3 py-1">Administrator (Chroniony)</span>
                      ) : (
                        roleConfirm?.userId === user.id ? (
                          <div className="flex gap-2 items-center bg-black/50 px-3 py-1 rounded border border-yellow-500/30">
                            <span className="text-xs text-yellow-500 mr-2">Czy na pewno nadać: {roleConfirm.roleName}?</span>
                            <button onClick={() => executeRoleChange(user.id, roleConfirm.roleId)} className="text-xs bg-green-600 px-2 py-1 rounded text-white">Tak</button>
                            <button onClick={() => setRoleConfirm(null)} className="text-xs bg-red-600 px-2 py-1 rounded text-white">Nie</button>
                          </div>
                        ) : (
                          <>
                            {user.role_id !== 2 && <button onClick={() => setRoleConfirm({ userId: user.id, roleId: 2, roleName: 'Klient' })} className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded">Klient</button>}
                            {user.role_id !== 3 && <button onClick={() => setRoleConfirm({ userId: user.id, roleId: 3, roleName: 'Menager' })} className="text-xs px-2 py-1 bg-blue-900/50 hover:bg-blue-800 rounded">Menager</button>}
                            {user.role_id !== 4 && <button onClick={() => setRoleConfirm({ userId: user.id, roleId: 4, roleName: 'Admin' })} className="text-xs px-2 py-1 bg-red-900/50 hover:bg-red-800 rounded text-red-200">Admin</button>}
                          </>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section id="kolekcja" className="py-20 px-6 max-w-7xl mx-auto">
        <h2 className="text-4xl font-serif mb-16 italic text-center">Nasza Oferta</h2>

        {roleId >= 3 && showAddForm && (
          <form onSubmit={handleAddWatch} className="mb-16 p-8 bg-white/5 border border-white/10 rounded-xl grid grid-cols-2 gap-4">
             <input type="text" placeholder="Marka" required value={newWatch.brand} onChange={e => setNewWatch({...newWatch, brand: e.target.value})} className="bg-black/50 p-3 outline-none rounded border border-white/10" />
             <input type="text" placeholder="Model" required value={newWatch.model} onChange={e => setNewWatch({...newWatch, model: e.target.value})} className="bg-black/50 p-3 outline-none rounded border border-white/10" />
             <input type="number" placeholder="Cena PLN" required value={newWatch.price_pln} onChange={e => setNewWatch({...newWatch, price_pln: e.target.value})} className="bg-black/50 p-3 outline-none rounded border border-white/10" />
             <select value={newWatch.status} onChange={e => setNewWatch({...newWatch, status: e.target.value})} className="bg-black/50 p-3 outline-none rounded border border-white/10 text-gray-300">
                <option value="dostępny">Dostępny</option>
                <option value="niedostępny">Niedostępny</option>
             </select>
             <input type="text" placeholder="Link do zdjęcia" value={newWatch.image_url} onChange={e => setNewWatch({...newWatch, image_url: e.target.value})} className="col-span-2 bg-black/50 p-3 outline-none rounded border border-white/10" required />
             <textarea placeholder="Opis produktu..." value={newWatch.description} onChange={e => setNewWatch({...newWatch, description: e.target.value})} className="col-span-2 bg-black/50 p-3 outline-none rounded border border-white/10 min-h-[80px]" />
             <button type="submit" className="col-span-2 bg-gold text-black py-3 font-bold rounded hover:bg-white transition">Dodaj Zegarek do bazy</button>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          {watches.map(watch => (
            <WatchCard 
              key={watch.id} {...watch} roleId={roleId} 
              onDelete={() => handleDeleteWatch(watch.id)} 
              onEditFull={(updatedData) => handleEditFullWatch(watch.id, updatedData)}
              // NOWE: Przekazujemy aktualną walutę i kurs do każdej karty produktu
              currency={currency}
              exchangeRate={currency === 'PLN' ? 1 : exchangeRates[currency]}
            />
          ))}
        </div>
      </section>

      <section id="kontakt" className="py-32 px-6 max-w-5xl mx-auto">
        {/* Kontener czatu bez zmian */}
        <div className="border border-white/10 bg-white/5 rounded-2xl min-h-[500px] flex overflow-hidden">
          {!token ? (
            <div className="m-auto flex flex-col gap-4 w-full max-w-xs p-6">
              <h3 className="text-xl font-serif text-center mb-4">{isLoginMode ? 'Panel Logowania' : 'Tworzenie Konta'}</h3>
              <form onSubmit={handleAuth} className="flex flex-col gap-4">
                <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} className="bg-black/50 p-3 rounded border border-white/10 outline-none focus:border-gold" required/>
                <input type="password" placeholder="Hasło" value={password} onChange={e => setPassword(e.target.value)} className="bg-black/50 p-3 rounded border border-white/10 outline-none focus:border-gold" required/>
                <button className="bg-gold text-black py-3 mt-2 rounded font-bold hover:bg-white">{isLoginMode ? 'Zaloguj się' : 'Zarejestruj się'}</button>
              </form>
              <button onClick={() => setIsLoginMode(!isLoginMode)} className="text-xs text-gray-400 hover:text-white mt-4 border-t border-white/10 pt-4">
                {isLoginMode ? 'Nie masz konta? Zarejestruj się' : 'Masz już konto? Zaloguj się'}
              </button>
            </div>
          ) : (
            <>
              {roleId >= 3 ? (
                <div className="flex w-full h-[600px]">
                  <div className="w-1/3 border-r border-white/10 bg-black/30 overflow-y-auto">
                    <h3 className="p-4 text-[10px] uppercase tracking-widest text-gray-400 border-b border-white/10">Skrzynka Odbiorcza</h3>
                    {chatClients.length === 0 && <p className="p-4 text-xs text-gray-600">Brak zapytań</p>}
                    {chatClients.map(uid => {
                      const msgs = groupedMessages[uid] || [];
                      const hasUnanswered = msgs.some(m => !m.admin_reply);
                      return (
                        <button key={uid} onClick={() => { setSelectedChatUser(uid); setMessageText(''); }} className={`w-full text-left p-4 border-b border-white/5 transition-all flex justify-between items-center ${selectedChatUser === uid ? 'bg-white/10 border-l-4 border-l-gold' : 'hover:bg-white/5'}`}>
                          <span className="text-sm">Klient #{uid}</span>
                          {hasUnanswered && <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>}
                        </button>
                      );
                    })}
                  </div>

                  <div className="w-2/3 flex flex-col">
                    {selectedChatUser ? (
                      <>
                        <div className="p-4 border-b border-white/10 bg-black/20">
                          <h4 className="font-serif italic text-lg">Konwersacja: Klient #{selectedChatUser}</h4>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                          {(groupedMessages[selectedChatUser] || []).map(m => (
                            <div key={m.id} className="flex flex-col gap-1">
                              <div className="mr-auto bg-black/60 p-3 max-w-[80%] rounded-xl text-sm border border-white/10">{m.message}</div>
                              {m.admin_reply && (
                                <div className="ml-auto bg-blue-900/30 text-blue-100 border border-blue-500/30 p-3 max-w-[80%] rounded-xl text-sm mt-1 whitespace-pre-wrap">
                                  {m.admin_reply}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        {(groupedMessages[selectedChatUser] && groupedMessages[selectedChatUser].length > 0) && (
                          <form onSubmit={(e) => handleReplyFromInput(e, groupedMessages[selectedChatUser][0])} className="p-4 border-t border-white/10 flex gap-2 bg-black/40">
                            <input type="text" value={messageText} onChange={e => setMessageText(e.target.value)} placeholder="Napisz do klienta..." className="flex-1 bg-black p-3 rounded outline-none border border-white/10 focus:border-gold" />
                            <button type="submit" className="bg-gold text-black px-6 rounded font-bold hover:bg-white transition">Wyślij</button>
                          </form>
                        )}
                      </>
                    ) : (
                      <div className="m-auto text-gray-500 text-sm">Wybierz klienta z listy po lewej.</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col w-full p-6">
                  <h3 className="text-gold text-[10px] tracking-widest uppercase mb-6 text-center border-b border-white/10 pb-4">Twoje pytania do obsługi</h3>
                  <div className="flex-1 overflow-y-auto space-y-6 mb-4 pr-2">
                    {messages.length === 0 && <p className="text-center text-gray-500 mt-10">Brak zapytań.</p>}
                    {messages.map(m => (
                      <div key={m.id} className="flex flex-col gap-2">
                        <div className="ml-auto bg-gold text-black p-3 max-w-[80%] rounded-xl text-sm shadow">{m.message}</div>
                        {m.admin_reply && (
                          <div className="mr-auto bg-black/80 text-white border border-white/20 p-3 max-w-[80%] rounded-xl text-sm whitespace-pre-wrap">
                            <span className="text-[9px] block text-gold mb-1">OBSŁUGA SKLEPU</span>
                            {m.admin_reply}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleSubmitMessage} className="flex gap-2 pt-4 border-t border-white/10">
                    <input type="text" value={messageText} onChange={e => setMessageText(e.target.value)} placeholder="Napisz zapytanie..." className="flex-1 bg-black/50 p-3 rounded border border-white/10 outline-none focus:border-gold" />
                    <button type="submit" className="bg-gold text-black px-6 rounded font-bold hover:bg-white transition">Wyślij</button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default App;