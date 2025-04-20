import React, { useState } from 'react'
import SignupModal from './SignupModal'
import MainScreen from './components/MainScreen'

function App() {
  const [username, setUsername] = useState(null)

  if (!username) {
    return <SignupModal onSignup={setUsername} />
  }

  return <MainScreen username={username} />
}

export default App
