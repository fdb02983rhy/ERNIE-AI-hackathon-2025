'use client';

import { useState, useEffect } from 'react';
import { getMockPrescription, type Prescription } from '@/lib/prescriptionMock';
import {
  prescriptionToCalendarEvents,
  createCalendarEvents,
} from '@/lib/googleCalendarHelper';
import styles from './test.module.css';

interface MedicationTask {
  day: number;
  date: string;
  time: string;
  drugName: string;
  completed?: boolean;
}

export default function TestPage() {
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [tasks, setTasks] = useState<MedicationTask[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState('');
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Initialize
  useEffect(() => {
    const prescription = getMockPrescription();
    setPrescription(prescription);

    // Generate medication tasks
    const generatedTasks: MedicationTask[] = [];
    const startDate = new Date(prescription.startDate);

    for (let dayOffset = 0; dayOffset < prescription.days; dayOffset++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + dayOffset);
      const dateStr = currentDate.toISOString().split('T')[0];

      for (const time of prescription.times) {
        generatedTasks.push({
          day: dayOffset + 1,
          date: dateStr,
          time: time,
          drugName: prescription.drugName,
        });
      }
    }

    setTasks(generatedTasks);
  }, []);

  const handleConnectGoogle = async () => {
    setStatus('🔄 Initializing Google login...');

    try {
      if (!window.google) {
        setStatus('❌ Google Identity Services not loaded');
        return;
      }

      google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        callback: handleGoogleSignInResponse,
      });

      google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
        }
      );

      google.accounts.id.prompt();
    } catch (error) {
      console.error('Error connecting to Google:', error);
      setStatus(`❌ Error: ${(error as Error).message}`);
    }
  };

  const handleGoogleSignInResponse = async (response: any) => {
    try {
      setStatus('✓ Google Sign-In successful!');
      const token = response.credential;
      setAccessToken(token);
      setIsConnected(true);
      setStatus('✓ Connected to Google Calendar');
    } catch (error) {
      console.error('Error processing Google sign-in:', error);
      setStatus(`❌ Error: ${(error as Error).message}`);
    }
  };

  const handleCreateReminders = async () => {
    if (!accessToken) {
      setStatus('❌ Not connected to Google Calendar. Click "Connect Google Calendar" first.');
      return;
    }

    if (!prescription || !tasks.length) {
      setStatus('❌ No tasks to create');
      return;
    }

    setStatus(`🔄 Creating ${tasks.length} medication reminders...`);

    try {
      const events = prescriptionToCalendarEvents(prescription);
      await createCalendarEvents(events, accessToken);
      setStatus(`✓ Successfully created ${tasks.length} medication reminders!`);
    } catch (error) {
      console.error('Error creating reminders:', error);
      setStatus(`❌ Error creating reminders: ${(error as Error).message}`);
    }
  };

  const toggleTaskCompletion = (index: number) => {
    setTasks((prevTasks) =>
      prevTasks.map((task, i) =>
        i === index ? { ...task, completed: !task.completed } : task
      )
    );
  };

  if (!prescription) {
    return <div className={styles.container}>Loading...</div>;
  }

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <h1>💊 Prescription → Google Calendar Test</h1>
        <p>Frontend-only test page for medication reminders</p>
      </div>

      <section className={styles.section}>
        <h2>📋 Prescription Details</h2>
        <div className={styles.prescriptionInfo}>
          <div className={styles.infoRow}>
            <strong>Drug:</strong> <span>{prescription.drugName}</span>
          </div>
          <div className={styles.infoRow}>
            <strong>Duration:</strong> <span>{prescription.days} days</span>
          </div>
          <div className={styles.infoRow}>
            <strong>Frequency:</strong> <span>{prescription.timesPerDay} times per day</span>
          </div>
          <div className={styles.infoRow}>
            <strong>Start Date:</strong> <span>{prescription.startDate}</span>
          </div>
          <div className={styles.infoRow}>
            <strong>Timezone:</strong> <span>{prescription.timezone}</span>
          </div>
          <div className={styles.infoRow}>
            <strong>Schedule:</strong> <span>{prescription.times.join(', ')}</span>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2>📅 Medication Tasks</h2>
        <div className={styles.taskStats}>
          <span>Total: {tasks.length}</span>
          <span>Completed: {completedCount}</span>
          <span>Remaining: {tasks.length - completedCount}</span>
        </div>
        <div className={styles.taskList}>
          {tasks.map((task, idx) => (
            <div
              key={idx}
              className={`${styles.taskItem} ${task.completed ? styles.completed : ''}`}
            >
              <input
                type="checkbox"
                checked={task.completed || false}
                onChange={() => toggleTaskCompletion(idx)}
                className={styles.taskCheckbox}
              />
              <div className={styles.taskContent}>
                <div className={styles.taskMain}>
                  <span className={styles.taskTime}>{task.time}</span>
                  <span className={styles.taskDrug}>{task.drugName}</span>
                </div>
                <div className={styles.taskDate}>
                  Day {task.day} · {task.date}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2>🔐 Google Calendar Integration</h2>
        <div className={styles.buttonGroup}>
          <button
            onClick={handleConnectGoogle}
            className={styles.button}
            disabled={isConnected}
          >
            {isConnected ? '✓ Connected to Google' : '🔗 Connect Google Calendar'}
          </button>
          <button
            onClick={handleCreateReminders}
            className={`${styles.button} ${styles.primaryButton}`}
            disabled={!isConnected || tasks.length === 0}
          >
            💾 Create Medication Reminders
          </button>
        </div>
        <div id="google-signin-button" className={styles.googleButton}></div>
      </section>

      {status && (
        <section className={styles.section}>
          <h2>📊 Status</h2>
          <div className={styles.status}>{status}</div>
        </section>
      )}
    </main>
  );
}
