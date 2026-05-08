const Content = ({ titulo, children }) => {
  return (
    <main className="content">
      <header className="content-header">
        <h1>{titulo}</h1>
      </header>
      {children}
    </main>
  )
}

export default Content