// Dashboard.jsx
import React, { useState, useEffect } from 'react';

const Dashboard = () => {
    const [dailyTasks, setDailyTasks] = useState({});
    const [weeklyGoals, setWeeklyGoals] = useState([]);
    const [monthlyGoals, setMonthlyGoals] = useState([]);

    const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD

    useEffect(() => {
        // Reset daily tasks at the beginning of the day
        const storedDate = Object.keys(dailyTasks)[0];
        if (storedDate !== today) {
            setDailyTasks({}); // Reset tasks
        }
    }, [today]);

    const addTask = (task) => {
        setDailyTasks((prev) => ({ ...prev, [today]: [...(prev[today] || []), task] }));
    };

    const addWeeklyGoal = (goal) => {
        setWeeklyGoals((prev) => [...prev, goal]);
    };

    const addMonthlyGoal = (goal) => {
        setMonthlyGoals((prev) => [...prev, goal]);
    };

    const editWeeklyGoal = (index, newGoal) => {
        const updatedGoals = [...weeklyGoals];
        updatedGoals[index] = newGoal;
        setWeeklyGoals(updatedGoals);
    };

    const deleteWeeklyGoal = (index) => {
        const updatedGoals = weeklyGoals.filter((_, i) => i !== index);
        setWeeklyGoals(updatedGoals);
    };

    const editMonthlyGoal = (index, newGoal) => {
        const updatedGoals = [...monthlyGoals];
        updatedGoals[index] = newGoal;
        setMonthlyGoals(updatedGoals);
    };

    const deleteMonthlyGoal = (index) => {
        const updatedGoals = monthlyGoals.filter((_, i) => i !== index);
        setMonthlyGoals(updatedGoals);
    };

    return (
        <div>
            <h1>Dashboard</h1>
            <h2>Focus Tasks</h2>
            <div>
                {/* Render Daily Tasks */}
                {dailyTasks[today] && dailyTasks[today].map((task, index) => (
                    <div key={index}>{task}</div>
                ))}
                <button onClick={() => addTask(prompt('Enter new task:'))}>Add Task</button>
            </div>
            <h2>Weekly Goals</h2>
            {/* Render Weekly Goals with edit and delete options */}
            {weeklyGoals.map((goal, index) => (
                <div key={index}>
                    {goal} 
                    <button onClick={() => editWeeklyGoal(index, prompt('Edit goal:', goal))}>Edit</button>
                    <button onClick={() => deleteWeeklyGoal(index)}>Delete</button>
                </div>
            ))}
            <button onClick={() => addWeeklyGoal(prompt('Enter new weekly goal:'))}>Add Weekly Goal</button>
            <h2>Monthly Goals</h2>
            {/* Render Monthly Goals with edit and delete options */}
            {monthlyGoals.map((goal, index) => (
                <div key={index}>
                    {goal} 
                    <button onClick={() => editMonthlyGoal(index, prompt('Edit goal:', goal))}>Edit</button>
                    <button onClick={() => deleteMonthlyGoal(index)}>Delete</button>
                </div>
            ))}
            <button onClick={() => addMonthlyGoal(prompt('Enter new monthly goal:'))}>Add Monthly Goal</button>
        </div>
    );
};

export default Dashboard;