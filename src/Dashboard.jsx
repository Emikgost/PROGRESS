import React, { useState, useEffect } from 'react';

const Dashboard = () => {
    // Daily focus tasks state indexed by date (vk).
    const [dailyFocusTasks, setDailyFocusTasks] = useState({});
    const [newWGoal, setNewWGoal] = useState({});
    const [newMGoal, setNewMGoal] = useState({});

    useEffect(() => {
        // Load daily focus tasks from localStorage or initialize.
        const storedTasks = JSON.parse(localStorage.getItem('dailyFocusTasks')) || {};
        setDailyFocusTasks(storedTasks);
    }, []);

    const vk = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format.

    const handleAddFocusTask = (task) => {
        setDailyFocusTasks(prev => {
            const updatedTasks = { ...prev, [vk]: [...(prev[vk] || []), task] };
            localStorage.setItem('dailyFocusTasks', JSON.stringify(updatedTasks));
            return updatedTasks;
        });
    };

    const handleDeleteFocusTask = (index) => {
        setDailyFocusTasks(prev => {
            const updatedTasks = {
                ...prev,
                [vk]: prev[vk].filter((_, i) => i !== index)
            };
            localStorage.setItem('dailyFocusTasks', JSON.stringify(updatedTasks));
            return updatedTasks;
        });
    };

    const handleAddWeeklyGoal = (goal) => {
        setNewWGoal(goal);
        // Logic to save weekly goal
    };

    const handleAddMonthlyGoal = (goal) => {
        setNewMGoal(goal);
        // Logic to save monthly goal
    };

    return (
        <div>
            <h1>Dashboard</h1>
            <h2>Today's Focus Tasks</h2>
            <ul>
                {dailyFocusTasks[vk]?.map((task, index) => (
                    <li key={index}>{task} <button onClick={() => handleDeleteFocusTask(index)}>Delete</button></li>
                ))}
            </ul>
            <button onClick={() => handleAddFocusTask('New Task')}>Add Daily Focus Task</button>
            
            <h2>Weekly Goals</h2>
            <input type="text" placeholder="Add New Weekly Goal" />
            <button onClick={() => handleAddWeeklyGoal('New WGoal')}>Add Goal</button>
            
            <h2>Monthly Goals</h2>
            <input type="text" placeholder="Add New Monthly Goal" />
            <button onClick={() => handleAddMonthlyGoal('New MGoal')}>Add Goal</button>
        </div>
    );
};

export default Dashboard;