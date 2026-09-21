const categories = [
    "All",
    "Sports",
    "Music",
    "Food",
    "Yard Sale",
    "Technology",
    "Other"
];


export default function CategoryFilter({
    selected,
    onChange
}) {
    return (
        <div
            className="category-filter"
            role="tablist"
            aria-label="Event categories"
        >

            {categories.map(
                (category) => (

                    <button
                        key={category}
                        type="button"
                        role="tab"
                        aria-selected={
                            selected === category
                        }
                        className={
                            selected === category
                                ? "filter-chip active"
                                : "filter-chip"
                        }
                        onClick={() =>
                            onChange(category)
                        }
                    >
                        {category}
                    </button>

                )
            )}

        </div>
    );
}