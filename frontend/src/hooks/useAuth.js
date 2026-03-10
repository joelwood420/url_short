import { useSessionCheck } from './useSessionCheck'

export function useAuth(setShowMyUrls, setShowLogin) {
    const { currentUser, setCurrentUser } = useSessionCheck()

    const handleLoginSuccess = (email) => {
        setCurrentUser(email)
        setShowLogin(false)
        if (setShowMyUrls) {
            setShowMyUrls(prev => {
                if (prev) {
                    setTimeout(() => setShowMyUrls(true), 100)
                    return false
                }
                return prev
            })
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

    return { currentUser, handleLoginSuccess, handleLogout }
}
