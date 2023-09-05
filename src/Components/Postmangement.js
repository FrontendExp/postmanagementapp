import axios from 'axios';
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';

function PostManagement() {
  const [postData, setPostData] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [postComments, setPostComments] = useState([]);
  const [deleteQueue, setDeleteQueue] = useState([]);

  useEffect(() => {
    // Load the delete queue from localStorage on component mount
    const storedQueue = JSON.parse(localStorage.getItem('deleteQueue')) || [];
    setDeleteQueue(storedQueue);

    axios
      .get('https://jsonplaceholder.typicode.com/posts')
      .then((res) => {
        setPostData(res.data);
      })
      .catch((error) => {
        console.error('Error fetching posts:', error);
      });
  }, []);

  useEffect(() => {
    // Save the delete queue to localStorage whenever it changes
    localStorage.setItem('deleteQueue', JSON.stringify(deleteQueue));
  }, [deleteQueue]);

  const fetchComments = (postId) => {
    axios
      .get(`https://jsonplaceholder.typicode.com/posts/${postId}/comments`)
      .then((res) => {
        setPostComments(res.data);
      })
      .catch((error) => {
        console.error('Error fetching comments:', error);
      });
  };

  const handlePostClick = (post) => {
    setSelectedPost(post);
    setDialogOpen(true);
    fetchComments(post.id); // Fetch comments for the selected post
  };

  const handleCloseDialog = () => {
    setSelectedPost(null);
    setDialogOpen(false);
    setPostComments([]); // Clear comments when dialog is closed
  };

  const handleSearch = (e) => {
    const searchText = e.target.value;
    setSearchText(searchText);

    const filtered = postData.filter((post) =>
      post.title.toLowerCase().includes(searchText.toLowerCase())
    );

    setFilteredData(filtered);
  };

  const addToDeleteQueue = (postId) => {
    setDeleteQueue((prevQueue) => [...prevQueue, postId]);
  };

  const executeDeleteQueue = async () => {
    for (const postId of deleteQueue) {
      try {
        await axios.delete(`https://jsonplaceholder.typicode.com/posts/${postId}`);
        // Remove the post ID from the queue after a successful delete
        setDeleteQueue((prevQueue) => prevQueue.filter((id) => id !== postId));
        // Remove the deleted post from the local state
        setPostData((prevData) => prevData.filter((post) => post.id !== postId));
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };

  const handleDeletePost = (postId) => {
    // Add the post ID to the delete queue
    addToDeleteQueue(postId);
    // Remove the post from the local state immediately
    setPostData((prevData) => prevData.filter((post) => post.id !== postId));
  };

  const handleRefreshState = () => {
    setSearchText('');
    setFilteredData([]);
    setSelectedPost(null);
    setDialogOpen(false);
    setPostComments([]);

    // Execute the delete queue and clear it
    executeDeleteQueue();

    // Fetch new posts after processing the queue
    axios
      .get('https://jsonplaceholder.typicode.com/posts')
      .then((res) => {
        setPostData(res.data);
        setDeleteQueue([]); // Clear the delete queue
      })
      .catch((error) => {
        console.error('Error fetching posts:', error);
      });
  };

  return (
    <>
      <TextField
        label="Search"
        variant="outlined"
        value={searchText}
        onChange={handleSearch}
      />
      <Button onClick={handleRefreshState}>Refresh State</Button>

      <div>
        {(searchText ? filteredData : postData).map((postdata) => (
          <Card key={postdata.id}>
            <CardContent>
              <h3>{postdata.title}</h3>
              <p>{postdata.body}</p>
              <Button onClick={() => handlePostClick(postdata)}>View Comments</Button>
              <Button onClick={() => handleDeletePost(postdata.id)}>Delete</Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        {selectedPost && (
          <>
            <DialogTitle>Comments</DialogTitle>
            <DialogContent>
              <List>
                {postComments.map((comment) => (
                  <ListItem key={comment.id}>
                    <ListItemText primary={comment.name} secondary={comment.body} />
                  </ListItem>
                ))}
              </List>
            </DialogContent>
          </>
        )}
      </Dialog>

      <div>
        {/* Display the number of items in the delete queue */}
        <p>DELETE QUEUE {deleteQueue.length}</p>
      </div>
    </>
  );
}

export default PostManagement;
