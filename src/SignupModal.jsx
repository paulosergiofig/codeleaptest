import React, { useState } from 'react'

const SignupModal = ({ onSignup }) => {
  const [input, setInput] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim()) onSignup(input.trim())
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div
        className="bg-white rounded-[16px] border border-gray-300 p-6"
        style={{ width: '500px', height: '205px', fontFamily: 'Roboto, sans-serif' }}
      >
        <h2 className="text-[22px] font-bold text-left">
          Welcome to CodeLeap network!
        </h2>

        <form onSubmit={handleSubmit}>
          <label className="block mt-6 mb-2 text-[16px] text-left">
            Please enter your username
          </label>
          <input
            type="text"
            className="border border-gray-300 rounded-[8px] px-3 py-1 w-[452px] h-[32px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Your username..."
            autoFocus
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!input.trim()}
              className={`mt-4 w-[111px] h-[32px] rounded-[8px] transition ml-auto
                ${input.trim()
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
              `}
            >
              Enter
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SignupModal
