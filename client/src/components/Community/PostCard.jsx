import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PostCard.module.css';
import useStore from '../../store/useStore';
import { deletePost } from '../../api/posts';

const PostCard = ({ post, showEditDelete = false, onDelete }) => {
    const navigate = useNavigate();
    const user = useStore((state) => state.user);

    const handleClick = () => {
        navigate(`/community/${post.id}`);
    };

    const handleApplyPreset = async (e) => {
        e.stopPropagation();
        const postId = post.id;
        if (!postId) return alert('Post not found');

        localStorage.setItem('loadPostId', postId.toString());
        localStorage.setItem('skipStartPage', 'true');
        window.location.href = '/'; // Go to DAW
    };

    const handleDetail = (e) => {
        e.stopPropagation();
        navigate(`/community/${post.id}`);
    };

    const handleDelete = async (e) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this?')) return;

        try {
            await deletePost(post.id);
            if (onDelete) {
                onDelete(post.id);
            } else {
                window.location.reload();
            }
        } catch (err) {
            console.error('Failed to delete post:', err);
            alert('Delete failed');
        }
    };

    return (
        <div className={styles.card} onClick={handleClick}>
            <h3 className={styles.title}>{post.title}</h3>

            <p className={styles.description}>
                {post.description || 'No description provided.'}
            </p>

            <div className={styles.footer}>
                <div className={styles.stats}>
                    <span className={styles.author}>
                        {post.User?.nickname || 'Unknown'}
                    </span>
                    <div className={styles.meta}>
                        <span>❤️ {post.likeCount || 0}</span>
                        <span>⬇️ {post.downloadCount || 0}</span>
                    </div>
                </div>

                <div className={styles.actions}>
                    <button onClick={handleApplyPreset} className={`${styles.btn} ${styles.btnApply}`}>
                        Load
                    </button>
                    {/* Detail button is redundant given whole card is clickable, but keeping for clarity if needed. 
                        Actually, let's remove it for cleaner UI, user accepts card click. 
                        Wait, let's keep it minimal if requested. 
                        I'll keep specific action buttons but maybe hide Detail? 
                        Let's keep it for now as "View". 
                    */}
                    {!showEditDelete && (
                        <button onClick={handleDetail} className={`${styles.btn} ${styles.btnDetail}`}>
                            View
                        </button>
                    )}

                    {showEditDelete && user && user.id === post.userId && (
                        <button onClick={handleDelete} className={`${styles.btn} ${styles.btnDelete}`}>
                            Delete
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PostCard;
