import { useState } from 'react';

const WatchCard = ({ id, brand, model, price_pln, status, image_url, description, roleId, onDelete, onEditFull, currency = 'PLN', exchangeRate = 1 }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  const [editData, setEditData] = useState({ brand, model, price_pln, status, image_url, description });

  const handleSave = (e) => {
    e.preventDefault();
    onEditFull(editData);
    setIsEditing(false);
  };

  // 🧮 LOGIKA PRZELICZANIA WALUTY
  const displayPrice = currency === 'PLN' 
    ? price_pln 
    : (price_pln / exchangeRate).toFixed(2); // Przeliczamy i zaokrąglamy do 2 miejsc po przecinku

  return (
    <div className="group relative flex flex-col h-full bg-white/5 border border-white/10 rounded-xl overflow-hidden pb-6">
      
      {roleId >= 3 && !isEditing && (
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
          {!showConfirmDelete ? (
            <>
              <button onClick={() => setShowConfirmDelete(true)} title="Usuń" className="bg-red-600/90 text-white w-8 h-8 rounded-full hover:bg-red-500 flex items-center justify-center text-xs shadow">✕</button>
              <button onClick={() => setIsEditing(true)} title="Edytuj" className="bg-blue-600/90 text-white w-8 h-8 rounded-full hover:bg-blue-500 flex items-center justify-center text-xs shadow">✎</button>
            </>
          ) : (
            <div className="bg-black/90 p-2 rounded flex flex-col gap-2 items-center border border-red-500/30">
              <span className="text-[10px] text-gray-300 uppercase tracking-widest">Usunąć?</span>
              <div className="flex gap-2">
                <button onClick={() => onDelete()} className="bg-red-600 px-2 py-1 text-xs rounded font-bold text-white">Tak</button>
                <button onClick={() => setShowConfirmDelete(false)} className="bg-gray-600 px-2 py-1 text-xs rounded text-white">Nie</button>
              </div>
            </div>
          )}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSave} className="p-6 flex flex-col gap-3 bg-black/95 h-full">
          <h4 className="text-gold text-xs uppercase tracking-widest text-center mb-2">Edycja Pojazdu</h4>
          <input type="text" value={editData.brand} onChange={e => setEditData({...editData, brand: e.target.value})} className="bg-white/10 text-white text-xs p-2 rounded outline-none border border-white/20" placeholder="Marka" required />
          <input type="text" value={editData.model} onChange={e => setEditData({...editData, model: e.target.value})} className="bg-white/10 text-white text-xs p-2 rounded outline-none border border-white/20" placeholder="Model" required />
          
          {/* Informacja dla admina, że w bazie zawsze zapisujemy PLN */}
          <div className="relative">
            <span className="absolute left-2 top-2 text-[10px] text-gray-400">PLN</span>
            <input type="number" value={editData.price_pln} onChange={e => setEditData({...editData, price_pln: e.target.value})} className="bg-white/10 text-white text-xs p-2 pl-8 rounded outline-none border border-white/20 w-full" placeholder="Cena w złotówkach" required />
          </div>

          <input type="text" value={editData.image_url} onChange={e => setEditData({...editData, image_url: e.target.value})} className="bg-white/10 text-white text-xs p-2 rounded outline-none border border-white/20" placeholder="Link do zdjęcia" required />
          <select value={editData.status} onChange={e => setEditData({...editData, status: e.target.value})} className="bg-gray-900 text-white text-xs p-2 rounded outline-none border border-white/20">
            <option value="dostępny">Dostępny</option>
            <option value="niedostępny">Niedostępny</option>
          </select>
          <textarea value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} className="bg-white/10 text-white text-xs p-2 rounded outline-none border border-white/20 min-h-[60px]" placeholder="Opis" />
          
          <div className="flex gap-2 mt-auto pt-4">
            <button type="submit" className="flex-1 bg-gold text-black text-xs font-bold py-2 rounded hover:bg-white">Zapisz</button>
            <button type="button" onClick={() => setIsEditing(false)} className="flex-1 bg-gray-600 text-white text-xs font-bold py-2 rounded hover:bg-gray-500">Anuluj</button>
          </div>
        </form>
      ) : (
        <>
          <div className="bg-[#111] aspect-[4/3] flex items-center justify-center p-6 shrink-0 cursor-pointer">
            <img src={image_url} alt={model} className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110" />
          </div>
          <div className="mt-6 text-center px-6 flex flex-col flex-1 cursor-pointer">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">{brand}</p>
            <h3 className="font-serif text-xl text-white italic">{model}</h3>
            
            {/* WYSWIETLANIE PRZELICZONEJ CENY */}
            <p className="text-gold text-lg mt-2 font-bold">{price_pln ? `${displayPrice} ${currency}` : 'Brak ceny'}</p>
            
            <p className="text-xs text-gray-400 mt-4 leading-relaxed line-clamp-3">{description || "Brak opisu."}</p>
            <div className="mt-auto pt-6">
              <span className={`text-[9px] uppercase tracking-widest px-3 py-1.5 border rounded-full ${status?.toLowerCase() === 'dostępny' ? 'border-green-500/30 text-green-400 bg-green-500/10' : 'border-red-500/30 text-red-400 bg-red-500/10'}`}>
                Status: {status || 'Nieznany'}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WatchCard;