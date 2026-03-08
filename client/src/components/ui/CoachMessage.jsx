function CoachMessage({ role = 'assistant', content, timestamp }) {
  const assistant = role === 'assistant';

  return (
    <div className={`flex ${assistant ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-xl rounded-2xl px-4 py-3 text-sm shadow-card ${
          assistant
            ? 'border border-slate-700 bg-panel-900 text-slate-100'
            : 'bg-gradient-to-r from-linear-500 to-accent-500 text-panel-950'
        }`}
      >
        <p>{content}</p>
        {timestamp ? <p className={`mt-2 text-[11px] ${assistant ? 'text-slate-500' : 'text-panel-900/70'}`}>{timestamp}</p> : null}
      </div>
    </div>
  );
}

export default CoachMessage;
