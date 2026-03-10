import { useEffect } from 'react'

export function useScrollToMyUrls(showMyUrls, myUrlsRef) {
    useEffect(() => {
        if (showMyUrls && myUrlsRef.current) {
            if (window.innerWidth < 768) {
                setTimeout(() => {
                    myUrlsRef.current.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    })
                }, 100)
            }
        }
    }, [showMyUrls, myUrlsRef])
}
