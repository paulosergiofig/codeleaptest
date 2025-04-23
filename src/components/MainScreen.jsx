import React, { useState, useEffect } from 'react'
import { MdDelete, MdEdit, MdThumbUp, MdComment } from 'react-icons/md'
import { motion, AnimatePresence } from 'framer-motion'
import { db } from '../firebase'
import {
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc,
  query, orderBy, Timestamp, getDoc, setDoc
} from 'firebase/firestore'

function timeAgo(timestamp) {
  if (!timestamp) return ''
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp)
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
  const [sortOrder, setSortOrder] = useState('newest')
  const [loading, setLoading] = useState(false)
  const [commentsCount, setCommentsCount] = useState({})
  const [likesCount, setLikesCount] = useState({})

  // Search posts and comments/likes count
  const fetchPosts = async () => {
    setLoading(true)
    try {
      const postsQuery = query(
        collection(db, "posts"),
        orderBy("created_datetime", sortOrder === "newest" ? "desc" : "asc")
      )
      const querySnapshot = await getDocs(postsQuery)
      const postsData = []
      const commentsCountMap = {}
      const likesCountMap = {}
      for (const docSnap of querySnapshot.docs) {
        const post = { id: docSnap.id, ...docSnap.data() }

        const commentsSnap = await getDocs(collection(db, "posts", docSnap.id, "comments"))
        commentsCountMap[docSnap.id] = commentsSnap.size

        const likesSnap = await getDocs(collection(db, "posts", docSnap.id, "likes"))
        likesCountMap[docSnap.id] = likesSnap.size
        postsData.push(post)
      }
      setPosts(postsData)
      setCommentsCount(commentsCountMap)
      setLikesCount(likesCountMap)
    } catch (error) {
      console.error('Error fetching posts:', error)
    }
    setLoading(false)
  }

  // Fetch like status for current user
  const fetchLikeStatus = async (postsList = posts) => {
    const likesStatusMap = {}
    for (const post of postsList) {
      const likeRef = doc(db, "posts", post.id, "likes", username)
      const likeDoc = await getDoc(likeRef)
      likesStatusMap[post.id] = likeDoc.exists()
    }
    setLikedPosts(likesStatusMap)
  }

  // Search for comments on a post
  const fetchCommentsForPost = async (postId) => {
    try {
      const commentsQuery = query(
        collection(db, "posts", postId, "comments"),
        orderBy("created_at", "desc")
      )
      const querySnapshot = await getDocs(commentsQuery)
      const commentsData = []
      querySnapshot.forEach((doc) => {
        commentsData.push({ id: doc.id, ...doc.data() })
      })
      setComments(prev => ({
        ...prev,
        [postId]: commentsData
      }))
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [sortOrder])

  useEffect(() => {
    if (posts.length > 0) fetchLikeStatus(posts)
  }, [posts, username])

  useEffect(() => {
    Object.entries(showComments).forEach(([postId, isVisible]) => {
      if (isVisible) fetchCommentsForPost(postId)
    })
  }, [showComments])

  // Create post
  const handleCreatePost = async (e) => {
    e.preventDefault()
    try {
      await addDoc(collection(db, "posts"), {
        username,
        title: newPost.title,
        content: newPost.content,
        created_datetime: Timestamp.now(),
        updated_datetime: Timestamp.now()
      })
      setNewPost({ title: '', content: '' })
      fetchPosts()
    } catch (error) {
      console.error('Error creating post:', error)
    }
  }

  // Edit post
  const handleEditPost = async () => {
    try {
      const postRef = doc(db, "posts", editingPost.id)
      await updateDoc(postRef, {
        title: editingPost.title,
        content: editingPost.content,
        updated_datetime: Timestamp.now()
      })
      setEditingPost(null)
      fetchPosts()
    } catch (error) {
      console.error('Error editing post:', error)
    }
  }

  // Delete post
  const handleDeletePost = async (postId) => {
    try {
      await deleteDoc(doc(db, "posts", postId))
      setShowDeleteAlert(null)
      setPosts(prev => prev.filter(post => post.id !== postId))
    } catch (error) {
      console.error('Error deleting post:', error)
    }
  }

  // Post like
  const handleLike = async (postId) => {
    try {
      const likeRef = doc(db, "posts", postId, "likes", username)
      const likeDoc = await getDoc(likeRef)
      if (likeDoc.exists()) {
        await deleteDoc(likeRef)
      } else {
        await setDoc(likeRef, {
          username,
          timestamp: Timestamp.now()
        })
      }
      fetchPosts() // Updates like count
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  // Add comment
  const handleAddComment = async (postId, commentText) => {
    if (!commentText.trim()) return
    try {
      await addDoc(collection(db, "posts", postId, "comments"), {
        username,
        content: commentText,
        created_at: Timestamp.now()
      })
      fetchPosts() // Update comment count
      fetchCommentsForPost(postId)
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const toggleComments = (postId) => {
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }))
  }

  // Filter and sort
  const [filterText, setFilterText] = useState('')
  const filteredPosts = posts.filter(post =>
    !filterText ||
    post.title.toLowerCase().includes(filterText.toLowerCase()) ||
    post.content.toLowerCase().includes(filterText.toLowerCase()) ||
    post.username.toLowerCase().includes(filterText.toLowerCase())
  )

  // Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.3 }
    }
  }

  return (
    <div className="bg-[#dddddd] min-h-screen flex flex-col items-center">
      <div className="w-full sm:w-[800px] min-h-screen bg-white flex flex-col items-center">
        {/* Header */}
        <div className="w-full h-[80px] bg-[#7695EC] rounded-t-[16px] flex items-center justify-between pl-4 sm:pl-[37px] pr-4">
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

        {/* Filter and sort bar */}
        <div className="w-full sm:w-[752px] mt-4 mb-2 flex flex-col sm:flex-row items-center justify-between gap-2 px-4 sm:px-0">
          <input
            type="text"
            placeholder="Search posts..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full sm:w-[400px] h-[32px] border border-[#777777] rounded-[8px] px-3 text-sm"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm">Sort by:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="border border-[#777777] rounded-[8px] px-2 py-1 text-sm"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>

        {/* Creation form */}
        <form
          onSubmit={handleCreatePost}
          className="w-full sm:w-[752px] bg-white rounded-[16px] border border-[#999999] mt-2 mb-6 p-4 sm:p-6 flex flex-col"
        >
          <span className="font-roboto font-bold text-[18px] sm:text-[22px] text-black mb-6">
            What's on your mind?
          </span>
          <label className="font-roboto font-normal text-[16px] text-black mb-1">Title</label>
          <input
            type="text"
            placeholder="Hello world"
            className="w-full sm:w-[704px] h-[32px] border border-[#777777] rounded-[8px] font-roboto font-normal text-[14px] text-black placeholder-[#CCCCCC] px-3 mb-4 focus:ring-2 focus:ring-[#7695EC] focus:outline-none transition"
            value={newPost.title}
            onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
          />
          <label className="font-roboto font-normal text-[16px] text-black mb-1">Content</label>
          <textarea
            placeholder="Content here"
            className="pt-1 w-full sm:w-[704px] h-[74px] border border-[#777777] rounded-[8px] font-roboto font-normal text-[14px] text-black placeholder-[#CCCCCC] px-3 mb-4 resize-none focus:ring-2 focus:ring-[#7695EC] focus:outline-none transition"
            value={newPost.content}
            onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
          />
          <div className="flex justify-end mt-auto">
            <button
              type="submit"
              disabled={!newPost.title || !newPost.content}
              className={`w-[120px] h-[32px] rounded-[8px] font-roboto font-bold text-[16px] border transition-colors ${
                newPost.title && newPost.content
                  ? 'bg-[#7695EC] border-[#7695EC] text-white hover:bg-blue-600'
                  : 'bg-gray-300 border-gray-300 text-white cursor-not-allowed'
              }`}
            >
              Create
            </button>
          </div>
        </form>

        {/* List of posts */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full flex flex-col items-center"
        >
          {filteredPosts.length === 0 && !loading ? (
            <div className="text-gray-500 py-8">No posts found</div>
          ) : (
            filteredPosts.map((post, index) => (
              <motion.div
                key={post.id}
                variants={itemVariants}
                className="w-full sm:w-[752px] bg-white rounded-[16px] border border-[#999999] mb-6"
                layout
              >
                {/* Header post */}
                <div className="h-[70px] bg-[#7695EC] rounded-t-[16px] flex items-center justify-between px-4 sm:px-6">
                  <span className="font-roboto font-bold text-[18px] sm:text-[22px] text-white">
                    {post.title}
                  </span>
                  {post.username === username && (
                    <div className="flex gap-4">
                      <button
                        onClick={() => setShowDeleteAlert(post.id)}
                        title="Delete"
                        className="w-[31px] h-[30px] flex items-center justify-center transition transform hover:scale-110"
                      >
                        <MdDelete className="text-white text-[18px] hover:text-red-300" />
                      </button>
                      <button
                        onClick={() => setEditingPost(post)}
                        title="Edit"
                        className="w-[31px] h-[30px] flex items-center justify-center transition transform hover:scale-110"
                      >
                        <MdEdit className="text-white text-[18px] hover:text-yellow-200" />
                      </button>
                    </div>
                  )}
                </div>
                {/* Body post */}
                <div className="px-4 sm:px-6 py-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-roboto font-bold text-[16px] sm:text-[18px] text-[#777777]">@{post.username}</span>
                    <span className="font-roboto font-normal text-[16px] sm:text-[18px] text-[#777777] text-right">{timeAgo(post.created_datetime)}</span>
                  </div>
                  <div className="font-roboto font-normal text-[16px] sm:text-[18px] text-black whitespace-pre-wrap mb-4">
                    {post.content}
                  </div>
                  {/* Interaction actions (like, comment) */}
                  <div className="flex items-center gap-4 pt-2 border-t border-gray-200">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1 text-sm ${likedPosts[post.id] ? 'text-blue-500' : 'text-gray-500'} transition-colors`}
                    >
                      <MdThumbUp size={18} />
                      <span>
                        {likesCount[post.id] > 0 ? `Like (${likesCount[post.id]})` : 'Like'}
                      </span>
                    </button>
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"
                    >
                      <MdComment size={18} />
                      <span>
                        {commentsCount[post.id] > 0
                          ? `Comments (${commentsCount[post.id]})`
                          : 'Comments'}
                      </span>
                    </button>
                  </div>
                  {/* Comments section */}
                  <AnimatePresence>
                    {showComments[post.id] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-3 overflow-hidden"
                      >
                        <div className="border-t pt-3">
                          {/* Comments list */}
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
                          {/* Comments form */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Write a comment..."
                              className="flex-1 border border-gray-300 rounded p-2 text-sm"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddComment(post.id, e.target.value)
                                  e.target.value = ''
                                }
                              }}
                            />
                            <button
                              onClick={(e) => {
                                const input = e.target.previousSibling
                                handleAddComment(post.id, input.value)
                                input.value = ''
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
              </motion.div>
            ))
          )}
          {loading && (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#7695EC]"></div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Editing mode */}
      <AnimatePresence>
        {editingPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
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
                  className="h-[32px] border border-[#777777] rounded-[8px] font-roboto font-normal text-[14px] text-black placeholder-[#CCCCCC] px-3 mb-4 w-full focus:ring-2 focus:ring-[#47B960] focus:outline-none transition"
                  style={{ width: 612 }}
                />
                <label className="font-roboto font-normal text-[16px] text-black mb-1 block">Content</label>
                <textarea
                  placeholder="Content here"
                  value={editingPost.content}
                  onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                  className="h-[74px] border border-[#777777] rounded-[8px] font-roboto font-normal text-[14px] text-black placeholder-[#CCCCCC] px-3 mb-4 resize-none w-full focus:ring-2 focus:ring-[#47B960] focus:outline-none transition"
                  style={{ width: 612 }}
                />
              </div>
              <div className="flex justify-end gap-4 px-8 pb-6 mt-auto">
                <button
                  onClick={() => setEditingPost(null)}
                  className="w-[120px] h-[32px] rounded-[8px] border border-black bg-white text-black font-roboto font-bold text-[16px] hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditPost}
                  className="w-[120px] h-[32px] rounded-[8px] border border-[#47B960] bg-[#47B960] text-white font-roboto font-bold text-[16px] hover:bg-green-600 transition-colors"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete mode */}
      <AnimatePresence>
        {showDeleteAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
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
                  className="w-[120px] h-[32px] rounded-[8px] border border-[#ccc] bg-white text-black font-medium font-roboto hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeletePost(showDeleteAlert)}
                  className="w-[120px] h-[32px] rounded-[8px] border border-[#cc0000] bg-[#ff4d4f] text-white font-medium font-roboto hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MainScreen
