import Loading from './Loading';

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IoIosArrowForward } from "react-icons/io";
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
                console.error('Error fetching subreddit:', error);
                alert('Failed to load subreddit data');
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [subredditId]);

    const handleUpdate = (updatedName: string, updatedTitle: string, updatedDescription: string) => {
        setIsLoading(true);
        fetchFromAPI(`/subreddits/${subredditId}`, 'PUT', {
            name: updatedName,
            title: updatedTitle,
            description: updatedDescription,
        })

            .then((response) => {
                console.log('Update response:', response);

                setSubreddit(response);
                setTitle(response.title || updatedTitle);
                setName(response.name || updatedName);
                setDescription(response.description || updatedDescription);

                alert('Subreddit updated successfully!');
            })
            .catch((error) => {
                console.error('Error updating subreddit:', error);
                alert(error.message || 'Failed to update subreddit');
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
            alert('Please enter a value');
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

        console.log(`Saving ${modalField}: ${modalValue}`);
        console.log(`Updated values: Name: ${updatedName}, Title: ${updatedTitle}, Description: ${updatedDescription}`);

        handleUpdate(updatedName, updatedTitle, updatedDescription);
        setIsModalOpen(false);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
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
                            <h2 className="edit-subreddit-item-title">Subreddit Name</h2>
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
                            <h2 className="edit-subreddit-item-title">Subreddit Title</h2>
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
                            <h2 className="edit-subreddit-item-title">About Description</h2>
                            <p className="edit-subreddit-item-description">
                                Update the description of your subreddit.
                            </p>
                        </div>
                        <span className="edit-subreddit-item-arrow"><IoIosArrowForward /></span>
                    </li>
                </ul>
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
        </div>
    );
};

export default EditSubreddit;