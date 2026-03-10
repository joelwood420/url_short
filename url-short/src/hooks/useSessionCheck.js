import { useState, useEffect } from 'react'

export function useSessionCheck() {
    const [currentUser, setCurrentUser] = useState(null)

    useEffect(() => {
        fetch('/me', { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                if (data.email) {
                    setCurrentUser(data.email)
                }
            })
            .catch(err => console.error('Session check failed:', err))
    }, [])

    return { currentUser, setCurrentUser }
}
