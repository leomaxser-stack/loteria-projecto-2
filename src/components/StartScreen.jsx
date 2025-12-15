import React, { useState } from 'react';

const StartScreen = ({ onCreateRoom, onJoinRoom }) => {
    const [name, setName] = useState('');
    const [roomId, setRoomId] = useState('');
    const [mode, setMode] = useState('name'); // name, selection, join

    const handleNameSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            setMode('selection');
        }
    };

    const handleCreate = () => {
        onCreateRoom(name);
    };

    const handleJoin = (e) => {
        e.preventDefault();
        if (roomId.trim()) {
            onJoinRoom(name, roomId);
        }
    };

    return (
        <div className="start-screen">
            <h1>Lotería del Centro-Norte</h1>
            <h2>¡Conoce Guanajuato, Zacatecas, San Luis Potosí y Aguascalientes!</h2>

            <div className="instructions" style={{ maxWidth: '600px', margin: '20px auto', textAlign: 'left', backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '2px solid var(--color-secondary)' }}>
                <h3>Instrucciones:</h3>
                <ol>
                    <li>Ingresa tu nombre para comenzar.</li>
                    <li>Crea una sala o únete a una existente con el código.</li>
                    <li>¡Marca las cartas en tu tablero y gana!</li>
                </ol>
            </div>

            {mode === 'name' && (
                <form onSubmit={handleNameSubmit}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <input
                            type="text"
                            placeholder="Escribe tu nombre"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="name-input"
                        />

                        <button type="submit">
                            Continuar
                        </button>
                    </div>
                </form>
            )}

            {mode === 'selection' && (
                <div className="mode-selection" style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '20px' }}>
                    <button onClick={handleCreate} style={{ backgroundColor: 'var(--color-primary)' }}>
                        Crear Sala
                    </button>
                    <button onClick={() => setMode('join')} style={{ backgroundColor: 'var(--color-secondary)' }}>
                        Unirse a Sala
                    </button>
                </div>
            )}

            {mode === 'join' && (
                <form onSubmit={handleJoin} style={{ marginTop: '20px' }}>
                    <h3 style={{ color: 'var(--color-text)' }}>Ingresa el Código de Sala</h3>
                    <input
                        type="text"
                        placeholder="CÓDIGO"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                        required
                        style={{ textTransform: 'uppercase', letterSpacing: '2px' }}
                    />
                    <br />
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
                        <button type="button" onClick={() => setMode('selection')} style={{ background: '#ccc' }}>Atrás</button>
                        <button type="submit">Unirse</button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default StartScreen;
