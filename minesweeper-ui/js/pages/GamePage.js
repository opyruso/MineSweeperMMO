const { useParams } = ReactRouterDOM;

export default function GamePage() {
  const { id } = useParams();
  return (
    <div className="game-page">
      <p>{id}</p>
    </div>
  );
}
