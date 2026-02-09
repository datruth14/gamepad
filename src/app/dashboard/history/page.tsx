export default function HistoryPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold">Game History</h1>
                <p className="text-primary-400 mt-1">View your past games and winnings</p>
            </div>

            <div className="card text-center py-12">
                <div className="text-6xl mb-4">🎮</div>
                <h2 className="text-xl font-bold mb-2">No Games Yet</h2>
                <p className="text-primary-400">
                    Your game history will appear here after you play.
                </p>
            </div>
        </div>
    );
}
