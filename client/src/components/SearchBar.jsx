export default function SearchBar({
    value,
    onChange
}) {
    return (
        <div className="search-box">

            <span
                className="search-icon"
                aria-hidden="true"
            >
                ⌕
            </span>

            <input
                type="search"
                value={value}
                onChange={(event) =>
                    onChange(event.target.value)
                }
                placeholder="Search events, neighborhoods, cities..."
                aria-label="Search events"
            />

            {value && (
                <button
                    type="button"
                    className="search-clear"
                    onClick={() => onChange("")}
                    aria-label="Clear search"
                >
                    ×
                </button>
            )}

        </div>
    );
}