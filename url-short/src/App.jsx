import { useState, useRef } from 'react'
import Hero from './components/Hero'
import MyUrls from './components/MyUrls'
import Create_User from './components/CreateUser'
import { useSessionCheck } from './hooks/useSessionCheck'
import { useScrollToMyUrls } from './hooks/useScrollToMyUrls'
import './App.css'

function App() {
  const [showMyUrls, setShowMyUrls] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const myUrlsRef = useRef(null)

  const { currentUser, setCurrentUser } = useSessionCheck()
  useScrollToMyUrls(showMyUrls, myUrlsRef)

  const handleLoginSuccess = (email) => {
    setCurrentUser(email)
    setShowLogin(false)
    if (showMyUrls) {
      setShowMyUrls(false)
      setTimeout(() => setShowMyUrls(true), 100)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/logout', {
        method: 'POST',
        credentials: 'include'
      })
      setCurrentUser(null)
      setShowMyUrls(false)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

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
