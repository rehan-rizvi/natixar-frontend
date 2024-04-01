// import { useEffect } from "react"
// import { useLocation, useNavigate } from "react-router-dom"
//
// // project import
// import useAuth from "hooks/useAuth"

// types
import useAuth from "hooks/useAuth"
import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { GuardProps } from "types/auth"

// ==============================|| AUTH GUARD ||============================== //

const AuthGuard = ({ children }: GuardProps) => {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (false) {
      // TODO uncomment
      // if (!isLoggedIn) {
      navigate("login", {
        state: {
          from: location.pathname,
        },
        replace: true,
      })
    }
  }, [isLoggedIn, navigate, location])
  return children
}

export default AuthGuard
