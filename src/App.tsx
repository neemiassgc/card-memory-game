import { useRef, useState } from 'react';
import { IRefPhaserGame, PhaserGame } from './PhaserGame';
import { colors } from './tools';
import { EventBus } from './game/EventBus';

function App()
{
    const [backgroundColor, setBackgroundColor] = useState(colors["first"].hex as string);
		const [open, setOpen] = useState(false);

    const phaserRef = useRef<IRefPhaserGame | null>(null);

    return (
      <div id="app" style={{backgroundColor}}>
					<PhaserGame ref={phaserRef} setBackgroundColor={setBackgroundColor} openModal={() => setOpen(true)} />
					<Modal open={open} close={() => setOpen(false)}/>
			</div>
    )
}

function Modal(props: { open: boolean, close: () => void }) {
	const [nickname, setNickname] = useState("");

	const setSanitizedNickname = (text: string) => {
		if (text.length >= 15) return;
		if (/^[a-zA-Z0-9]*$/.test(text))
			setNickname(text)
	}

	return (
		<div style={{display: props.open ? "block" : "none"}} id="myModal" className="modal">
			<div className="modal-content">
				<span
					onClick={() => {
						props.close();
						EventBus.emit("close-modal");
					}}
					className="close">
					&times;
				</span>
				<div>
					<span>Enter your nickname to start</span>
					<input type="text" value={nickname} onChange={event => setSanitizedNickname(event.target.value)} />
					<button onClick={() => {
						EventBus.emit("set-nickname", nickname)
						props.close();
					}}>Confirm</button>
				</div>
			</div>
		</div>
	)
}

export default App
