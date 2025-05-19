import { useRef, useState } from 'react';
import { IRefPhaserGame, PhaserGame } from './PhaserGame';
import { colors } from './tools';

function App()
{
    const [backgroundColor, setBackgroundColor] = useState(colors["first"].hex as string);

    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    return (
        <div id="app" style={{backgroundColor}}>
            <PhaserGame ref={phaserRef} setBackgroundColor={setBackgroundColor} />
        </div>
    )
}

export default App
