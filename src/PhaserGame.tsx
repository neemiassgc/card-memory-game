import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from 'react';
import StartGame from './game/main';
import { EventBus } from './game/EventBus';
import { use } from 'matter';

export interface IRefPhaserGame
{
    game: Phaser.Game | null;
    scene: Phaser.Scene | null;
}

interface IProps {
    setBackgroundColor: (color: string) => void,
    openModal: () => void,
}

export const PhaserGame = forwardRef<IRefPhaserGame, IProps>(function PhaserGame({
    setBackgroundColor,
    openModal
}, ref)
{
    const game = useRef<Phaser.Game | null>(null!);

    useLayoutEffect(() =>
    {
        if (game.current === null)
        {

            game.current = StartGame("game-container");

            if (typeof ref === 'function')
            {
                ref({ game: game.current, scene: null });
            } else if (ref)
            {
                ref.current = { game: game.current, scene: null };
            }

        }

        return () =>
        {
            if (game.current)
            {
                game.current.destroy(true);
                if (game.current !== null)
                {
                    game.current = null;
                }
            }
        }
    }, [ref]);

    useEffect(() =>
    {
        EventBus.on("change-background-color", (color: string) => {
            setBackgroundColor(color);
        })
        EventBus.on("open-modal", () => openModal());

        EventBus.on("exit", (yes: () => void, no?: () => void) => {
            const confirmation = window.confirm("Confirm");
            if (confirmation) yes();
            else if (no) no();
        })
        
        return () => {
            EventBus.off("change-background-color");
            EventBus.off("open-modal");
            EventBus.off("exit");
        }
    }, [ref]);

    useVisibilityApi();

    return (
        <div id="game-container"></div>
    );

});

function useVisibilityApi() {
    useEffect(() => {
        const handleVisibilityChange = () => {
            EventBus.emit("visibility-change", document.hidden);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

}
