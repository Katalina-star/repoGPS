const Content = ({ titulo, busqueda, onBuscar, children }) => {
  return (
    <main className="content">
      <header className="content-header">
        <h1>{titulo}</h1>
        <div className="search-box">
          <input 
            type="text" 
            placeholder="Buscar..." 
            value={busqueda} 
            onChange={e => onBuscar(e.target.value)} 
          />
        </div>
      </header>
      {children}
    </main>
  )
}

export default Content