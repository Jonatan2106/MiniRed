import Loading from './Loading';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IoIosArrowForward } from "react-icons/io";
import { FaEdit, FaTrash } from "react-icons/fa";
import { fetchFromAPI } from '../../api/auth';

import '../styles/editsubreddit.css';
import '../styles/main.css';

const EditSubreddit = () => {
    const { subredditId } = useParams<{ subredditId: string }>();
    const [subreddit, setSubreddit] = useState(null);
    const [title, setTitle] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalField, setModalField] = useState('');
    const [modalValue, setModalValue] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [showConfirm, setShowConfirm] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        setIsLoading(true);
        fetchFromAPI(`/subreddits/${subredditId}`, 'GET')
            .then((data) => {
                setSubreddit(data);
                setTitle(data.title);
                setName(data.name);
                setDescription(data.description);
            })
            .catch((error) => {
                setStatus({ type: 'error', message: 'Failed to load subreddit data' });
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [subredditId]);

    const handleUpdate = (updatedName: string, updatedTitle: string, updatedDescription: string) => {
        setIsLoading(true);
        setStatus(null);
        fetchFromAPI(`/subreddits/${subredditId}`, 'PUT', {
            name: updatedName,
            title: updatedTitle,
            description: updatedDescription,
        })
            .then((response) => {
                setSubreddit(response);
                setTitle(response.title || updatedTitle);
                setName(response.name || updatedName);
                setDescription(response.description || updatedDescription);
                setStatus({ type: 'success', message: 'Subreddit updated successfully!' });
            })
            .catch((error) => {
                setStatus({ type: 'error', message: error.message || 'Failed to update subreddit' });
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    const handleCardClick = (field: string, value: string) => {
        setModalField(field);
        setModalValue(value);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!modalValue.trim()) {
            setStatus({ type: 'error', message: 'Please enter a value' });
            return;
        }

        let updatedName = name;
        let updatedTitle = title;
        let updatedDescription = description;

        if (modalField === 'Subreddit Name') {
            updatedName = modalValue;
            setName(modalValue);
        } else if (modalField === 'Subreddit Title') {
            updatedTitle = modalValue;
            setTitle(modalValue);
        } else if (modalField === 'About Description') {
            updatedDescription = modalValue;
            setDescription(modalValue);
        }

        handleUpdate(updatedName, updatedTitle, updatedDescription);
        setIsModalOpen(false);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const handleDelete = async () => {
        setIsLoading(true);
        setStatus(null);
        try {
            await fetchFromAPI(`/subreddits/${subredditId}`, "DELETE");
            setStatus({ type: 'success', message: 'Subreddit deleted successfully!' });
            setTimeout(() => navigate("/"), 1200);
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message || "Failed to delete subreddit" });
        } finally {
            setIsLoading(false);
            setShowConfirm(false);
        }
    };

    if (isLoading) {
        return <Loading />;
    }

    return (
        <div className="edit-subreddit-wrapper">
            <div className="edit-subreddit-container">
                <div className="edit-subreddit-header">
                    <h1 className="edit-subreddit-title">Edit Subreddit</h1>
                    <button className="post-page-back-button" onClick={() => navigate('/r/' + name)}>
                        Back
                    </button>
                </div>
                <ul className="edit-subreddit-list">
                    <li
                        className="edit-subreddit-item"
                        onClick={() => handleCardClick('Subreddit Name', name)}
                    >
                        <div className="edit-subreddit-item-content">
                            <h2 className="edit-subreddit-item-title">
                                <FaEdit className="edit-icon" /> Subreddit Name
                            </h2>
                            <p className="edit-subreddit-item-description">
                                Update the name of your subreddit.
                            </p>
                        </div>
                        <span className="edit-subreddit-item-arrow"><IoIosArrowForward /></span>
                    </li>
                    <li
                        className="edit-subreddit-item"
                        onClick={() => handleCardClick('Subreddit Title', title)}
                    >
                        <div className="edit-subreddit-item-content">
                            <h2 className="edit-subreddit-item-title">
                                <FaEdit className="edit-icon" /> Subreddit Title
                            </h2>
                            <p className="edit-subreddit-item-description">
                                Update the title of your subreddit.
                            </p>
                        </div>
                        <span className="edit-subreddit-item-arrow"><IoIosArrowForward /></span>
                    </li>
                    <li
                        className="edit-subreddit-item"
                        onClick={() => handleCardClick('About Description', description)}
                    >
                        <div className="edit-subreddit-item-content">
                            <h2 className="edit-subreddit-item-title">
                                <FaEdit className="edit-icon" /> About Description
                            </h2>
                            <p className="edit-subreddit-item-description">
                                Update the description of your subreddit.
                            </p>
                        </div>
                        <span className="edit-subreddit-item-arrow"><IoIosArrowForward /></span>
                    </li>
                </ul>
                <button
                    className="delete-subreddit-btn"
                    onClick={() => setShowConfirm(true)}
                    disabled={isLoading}
                >
                    <FaTrash className="delete-icon" /> Delete Subreddit
                </button>
                {status && (
                    <div className={`status-message ${status.type}`}>
                        {status.message}
                    </div>
                )}
            </div>
            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2>{modalField}</h2>
                            <button className="modal-close" onClick={handleCancel}>
                                ✕
                            </button>
                        </div>
                        <p className="modal-description">
                            {modalField === 'Subreddit Name'
                                ? 'Update the name of your subreddit.'
                                : modalField === 'Subreddit Title'
                                    ? 'Update the title of your subreddit.'
                                    : 'Update the description of your subreddit.'}
                        </p>
                        <input
                            type="text"
                            className="modal-input"
                            value={modalValue}
                            onChange={(e) => setModalValue(e.target.value)}
                        />
                        <div className="modal-actions">
                            <button className="modal-cancel" onClick={handleCancel}>
                                Cancel
                            </button>
                            <button className="modal-save" onClick={handleSave}>
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Custom Delete Confirmation Modal */}
            {showConfirm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2>Delete Subreddit</h2>
                            <button className="modal-close" onClick={() => setShowConfirm(false)}>
                                ✕
                            </button>
                        </div>
                        <p className="modal-description">
                            Are you sure you want to delete this subreddit? This action cannot be undone.
                        </p>
                        <div className="modal-actions">
                            <button className="modal-cancel" onClick={() => setShowConfirm(false)}>
                                Cancel
                            </button>
                            <button className="modal-save" style={{background:'#FF4500'}} onClick={handleDelete} disabled={isLoading}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditSubreddit;