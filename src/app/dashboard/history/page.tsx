export default function HistoryPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold">More Games</h1>
                <p className="text-primary-400 mt-1">Explore our collection of premium games</p>
            </div>

            <div className="card text-center py-12">
                <div className="text-6xl mb-4">🎮</div>
                <h2 className="text-xl font-bold mb-2">No Games Yet</h2>
                <p className="text-primary-400">
                    More games you can earn from will be added soon!
                </p>
            </div>
        </div>
    );
}
