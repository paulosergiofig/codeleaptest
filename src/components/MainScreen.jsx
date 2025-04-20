import React, { useState, useEffect } from 'react'
import { MdDelete, MdEdit, MdThumbUp, MdComment } from 'react-icons/md'
import { motion, AnimatePresence } from 'framer-motion'

function timeAgo(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin === 1) return '1 minute ago'
  if (diffMin < 60) return `${diffMin} minutes ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH === 1) return '1 hour ago'
  if (diffH < 24) return `${diffH} hours ago`
  const diffD = Math.floor(diffH / 24)
  if (diffD === 1) return '1 day ago'
  return `${diffD} days ago`
}

const MainScreen = ({ username }) => {
  const [posts, setPosts] = useState([])
  const [newPost, setNewPost] = useState({ title: '', content: '' })
  const [editingPost, setEditingPost] = useState(null)
  const [showDeleteAlert, setShowDeleteAlert] = useState(null)
  const [likedPosts, setLikedPosts] = useState({})
  const [comments, setComments] = useState({})
  const [showComments, setShowComments] = useState({})

  // Fetch posts
  const fetchPosts = async () => {
    try {
      const response = await fetch('http://dev.codeleap.co.uk/careers/')
      const data = await response.json()
      setPosts(data.results.sort((a, b) =>
        new Date(b.created_datetime) - new Date(a.created_datetime)
      ))
    } catch (error) {
      console.error('Error fetching posts:', error)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  // Create Post
  const handleCreatePost = async (e) => {
    e.preventDefault()
    try {
      await fetch('http://dev.codeleap.co.uk/careers/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          title: newPost.title,
          content: newPost.content
        })
      })
      setNewPost({ title: '', content: '' })
      fetchPosts()
    } catch (error) {
      console.error('Error creating post:', error)
    }
  }

  // Edit Post
  const handleEditPost = async () => {
    try {
      await fetch(`http://dev.codeleap.co.uk/careers/${editingPost.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editingPost.title,
          content: editingPost.content
        })
      })
      setEditingPost(null)
      fetchPosts()
    } catch (error) {
      console.error('Error editing post:', error)
    }
  }

  // Delete Post
  const handleDeletePost = async (postId) => {
    try {
      await fetch(`http://dev.codeleap.co.uk/careers/${postId}/`, {
        method: 'DELETE'
      })
      setShowDeleteAlert(null)
      fetchPosts()
    } catch (error) {
      console.error('Error deleting post:', error)
    }
  }

  // Like Post (visual only)
  const handleLike = (postId) => {
    setLikedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }))
  }

  // Comments
  const handleAddComment = (postId, comment) => {
    if (!comment.trim()) return
    setComments(prev => ({
      ...prev,
      [postId]: [
        ...(prev[postId] || []),
        {
          id: Date.now(),
          username,
          content: comment,
          created_at: new Date()
        }
      ]
    }))
  }
  const toggleComments = (postId) => {
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }))
  }

  return (
    <div className="bg-[#dddddd] min-h-screen flex flex-col items-center">
      {/* Cabeçalho */}
      <div className="w-full sm:w-[800px] h-[80px] bg-[#7695EC] rounded-t-[16px] flex items-center justify-between pl-4 sm:pl-[37px] pr-4">
        <span className="font-roboto font-bold text-[20px] sm:text-[22px] leading-[1] text-white select-none">
          CodeLeap Network
        </span>
        <button
          onClick={() => window.location.reload()}
          className="bg-white text-[#7695EC] font-bold px-4 py-1 rounded-[8px] border border-[#7695EC] hover:bg-[#f0f4ff] transition"
        >
          Logout
        </button>
      </div>

      {/* Container principal */}
      <div className="w-full sm:w-[800px] flex flex-col items-center pb-10">
        {/* Formulário de criação */}
        <form
          onSubmit={handleCreatePost}
          className="w-full sm:w-[752px] bg-white rounded-[16px] border border-[#999999] mt-6 mb-6 p-4 sm:p-6 flex flex-col"
        >
          <span className="font-roboto font-bold text-[18px] sm:text-[22px] text-black mb-6">
            What's on your mind?
          </span>
          <label className="font-roboto font-normal text-[16px] text-black mb-1">Title</label>
          <input
            type="text"
            placeholder="Hello world"
            className="w-full sm:w-[704px] h-[32px] border border-[#777777] rounded-[8px] font-roboto font-normal text-[14px] text-black placeholder-[#CCCCCC] px-3 mb-4"
            value={newPost.title}
            onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
          />
          <label className="font-roboto font-normal text-[16px] text-black mb-1">Content</label>
          <textarea
            placeholder="Content here"
            className="w-full sm:w-[704px] h-[74px] border border-[#777777] rounded-[8px] font-roboto font-normal text-[14px] text-black placeholder-[#CCCCCC] px-3 mb-4 resize-none"
            value={newPost.content}
            onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
          />
          <div className="flex justify-end mt-auto">
            <button
              type="submit"
              disabled={!newPost.title || !newPost.content}
              className={`w-[120px] h-[32px] rounded-[8px] font-roboto font-bold text-[16px] border ${
                newPost.title && newPost.content
                  ? 'bg-[#7695EC] border-[#7695EC] text-white hover:bg-blue-600'
                  : 'bg-gray-300 border-gray-300 text-white cursor-not-allowed'
              }`}
            >
              Create
            </button>
          </div>
        </form>

        {/* Lista de postagens */}
        {posts.map(post => (
          <div
            key={post.id}
            className="w-full sm:w-[752px] bg-white rounded-[16px] border border-[#999999] mb-6"
          >
            {/* Cabeçalho do post */}
            <div className="h-[70px] bg-[#7695EC] rounded-t-[16px] flex items-center justify-between px-4 sm:px-6">
              <span className="font-roboto font-bold text-[18px] sm:text-[22px] text-white">
                {post.title}
              </span>
              {post.username === username && (
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowDeleteAlert(post.id)}
                    title="Delete"
                    className="w-[31px] h-[30px] flex items-center justify-center"
                  >
                    <MdDelete className="text-white text-[22px] hover:text-red-300" />
                  </button>
                  <button
                    onClick={() => setEditingPost(post)}
                    title="Edit"
                    className="w-[31px] h-[30px] flex items-center justify-center"
                  >
                    <MdEdit className="text-white text-[22px] hover:text-yellow-200" />
                  </button>
                </div>
              )}
            </div>
            {/* Corpo do post */}
            <div className="px-4 sm:px-6 py-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-roboto font-bold text-[16px] sm:text-[18px] text-[#777777]">@{post.username}</span>
                <span className="font-roboto font-normal text-[16px] sm:text-[18px] text-[#777777] text-right">{timeAgo(post.created_datetime)}</span>
              </div>
              <div className="font-roboto font-normal text-[16px] sm:text-[18px] text-black whitespace-pre-wrap mb-4">
                {post.content}
              </div>
              {/* Ações de interação */}
              <div className="flex items-center gap-4 pt-2 border-t border-gray-200">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-1 text-sm ${likedPosts[post.id] ? 'text-blue-500' : 'text-gray-500'}`}
                >
                  <MdThumbUp size={20} />
                  <span>{likedPosts[post.id] ? 'Liked' : 'Like'}</span>
                </button>
                <button
                  onClick={() => toggleComments(post.id)}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  <MdComment size={20} />
                  <span>Comments {(comments[post.id]?.length || 0) > 0 ? `(${comments[post.id]?.length})` : ''}</span>
                </button>
              </div>
              {/* Seção de comentários */}
              <AnimatePresence>
                {showComments[post.id] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-3 overflow-hidden"
                  >
                    <div className="border-t pt-3">
                      {/* Lista de comentários */}
                      <div className="mb-3 max-h-[200px] overflow-y-auto">
                        {(comments[post.id] || []).length > 0 ? (
                          (comments[post.id] || []).map(comment => (
                            <div key={comment.id} className="bg-gray-50 p-2 rounded mb-2">
                              <div className="flex justify-between">
                                <span className="font-bold text-xs">@{comment.username}</span>
                                <span className="text-xs text-gray-500">{timeAgo(comment.created_at)}</span>
                              </div>
                              <p className="text-sm mt-1">{comment.content}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No comments yet</p>
                        )}
                      </div>
                      {/* Formulário de comentário */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          className="flex-1 border border-gray-300 rounded p-2 text-sm"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddComment(post.id, e.target.value);
                              e.target.value = '';
                            }
                          }}
                        />
                        <button
                          onClick={(e) => {
                            const input = e.target.previousSibling;
                            handleAddComment(post.id, input.value);
                            input.value = '';
                          }}
                          className="bg-[#7695EC] text-white px-3 py-1 rounded text-sm"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de edição */}
      {editingPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div
            className="bg-white rounded-[16px] border border-[#999999] flex flex-col"
            style={{ width: 660, height: 334 }}
          >
            <div className="px-8 pt-6">
              <h3 className="font-roboto font-bold text-[22px] text-black mb-4">Edit item</h3>
              <label className="font-roboto font-normal text-[16px] text-black mb-1 block">Title</label>
              <input
                type="text"
                placeholder="Hello world"
                value={editingPost.title}
                onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                className="h-[32px] border border-[#777777] rounded-[8px] font-roboto font-normal text-[14px] text-black placeholder-[#CCCCCC] px-3 mb-4 w-full"
                style={{ width: 612 }}
              />
              <label className="font-roboto font-normal text-[16px] text-black mb-1 block">Content</label>
              <textarea
                placeholder="Content here"
                value={editingPost.content}
                onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                className="h-[74px] border border-[#777777] rounded-[8px] font-roboto font-normal text-[14px] text-black placeholder-[#CCCCCC] px-3 mb-4 resize-none w-full"
                style={{ width: 612 }}
              />
            </div>
            <div className="flex justify-end gap-4 px-8 pb-6 mt-auto">
              <button
                onClick={() => setEditingPost(null)}
                className="w-[120px] h-[32px] rounded-[8px] border border-black bg-white text-black font-roboto font-bold text-[16px]"
              >
                Cancel
              </button>
              <button
                onClick={handleEditPost}
                className="w-[120px] h-[32px] rounded-[8px] border border-[#47B960] bg-[#47B960] text-white font-roboto font-bold text-[16px]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de deletar */}
      {showDeleteAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div
            className="bg-white rounded-[16px] border border-[#ccc] relative"
            style={{ width: 660, height: 146 }}
          >
            <div
              className="text-[22px] font-roboto text-left text-black"
              style={{ margin: '24px 32px 0 32px' }}
            >
              Are you sure you want to delete this item?
            </div>
            <div
              className="absolute flex gap-4"
              style={{ bottom: 24, right: 32 }}
            >
              <button
                onClick={() => setShowDeleteAlert(null)}
                className="w-[120px] h-[32px] rounded-[8px] border border-[#ccc] bg-white text-black font-medium font-roboto"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePost(showDeleteAlert)}
                className="w-[120px] h-[32px] rounded-[8px] border border-[#cc0000] bg-[#ff4d4f] text-white font-medium font-roboto"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MainScreen
