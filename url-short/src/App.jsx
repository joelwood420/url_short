import { useState, useRef } from 'react'
import Hero from './components/Hero'
import MyUrls from './components/MyUrls'
import Create_User from './components/CreateUser'
import { useAuth } from './hooks/useAuth'
import { useScrollToMyUrls } from './hooks/useScrollToMyUrls'
import './App.css'

function App() {
  const [showMyUrls, setShowMyUrls] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const myUrlsRef = useRef(null)

  const { currentUser, handleLoginSuccess, handleLogout } = useAuth(setShowMyUrls, setShowLogin)
  useScrollToMyUrls(showMyUrls, myUrlsRef)

  return (
    <div className="App">
      <Hero 
        onViewMyLinks={() => setShowMyUrls(!showMyUrls)} 
        showMyUrls={showMyUrls}
        onShowLogin={() => setShowLogin(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      {showMyUrls && <div ref={myUrlsRef}><MyUrls /></div>}
      {showLogin && (
        <Create_User 
          onClose={() => setShowLogin(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </div>
  )
}

export default App
