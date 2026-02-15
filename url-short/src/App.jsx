import { useState } from 'react'
import Hero from './components/Hero'
import MyUrls from './components/MyUrls'
import './App.css'

function App() {
  const [showMyUrls, setShowMyUrls] = useState(false)

  return (
    <div className="App">
      <Hero onViewMyLinks={() => setShowMyUrls(!showMyUrls)} showMyUrls={showMyUrls} />
      {showMyUrls && <MyUrls />}
    </div>
  )
}

export default App
