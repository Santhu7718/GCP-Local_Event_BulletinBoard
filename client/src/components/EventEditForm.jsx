import {
    useEffect,
    useState
} from "react";


const categories = [
    "Sports",
    "Music",
    "Food",
    "Yard Sale",
    "Technology",
    "Other"
];


function toLocalDateTime(
    isoString
) {

    const date =
        new Date(
            isoString
        );


    const offset =
        date.getTimezoneOffset();


    const localDate =
        new Date(
            date.getTime() -
            offset * 60 * 1000
        );


    return localDate
        .toISOString()
        .slice(0, 16);
}


export default function EventEditForm({
    event,
    onClose,
    onSave,
    saving = false
}) {

    const [form, setForm] =
        useState({

            title:
                event.title,

            dateTime:
                toLocalDateTime(
                    event.dateTime
                ),

            location:
                event.location,

            city:
                event.city,

            category:
                event.category,

            description:
                event.description,

            organizerName:
                event.organizerName

        });


    const [error, setError] =
        useState("");


    useEffect(() => {

        setForm({

            title:
                event.title,

            dateTime:
                toLocalDateTime(
                    event.dateTime
                ),

            location:
                event.location,

            city:
                event.city,

            category:
                event.category,

            description:
                event.description,

            organizerName:
                event.organizerName

        });

    }, [event]);


    function handleChange(
        inputEvent
    ) {

        const {
            name,
            value
        } =
            inputEvent.target;


        setForm(
            (current) => ({
                ...current,
                [name]: value
            })
        );

    }


    async function handleSubmit(
        submitEvent
    ) {

        submitEvent.preventDefault();

        setError("");


        if (
            new Date(form.dateTime) <=
            new Date()
        ) {

            setError(
                "The event must remain in the future."
            );

            return;
        }


        try {

            await onSave({

                title:
                    form.title.trim(),

                dateTime:
                    new Date(
                        form.dateTime
                    ).toISOString(),

                location:
                    form.location.trim(),

                city:
                    form.city.trim(),

                category:
                    form.category,

                description:
                    form.description.trim(),

                organizerName:
                    form.organizerName.trim()

            });

        } catch (error) {

            setError(
                error?.message ||
                "Unable to update event."
            );

        }

    }


    return (

        <div
            className="modal-backdrop"
            onMouseDown={(e) => {

                if (
                    e.target ===
                    e.currentTarget
                ) {

                    onClose();

                }

            }}
        >

            <div className="modal">

                <div className="modal-top">

                    <div>

                        <p className="eyebrow">
                            EDIT
                        </p>

                        <h2>
                            Update Event
                        </h2>

                        <p className="modal-subtitle">
                            Changes will be shown
                            on the event card.
                        </p>

                    </div>


                    <button
                        type="button"
                        className="close-button"
                        onClick={onClose}
                        disabled={saving}
                    >
                        ×
                    </button>

                </div>


                {error && (

                    <div className="form-error">
                        {error}
                    </div>

                )}


                <form
                    className="event-form"
                    onSubmit={
                        handleSubmit
                    }
                >

                    <label>
                        Event name

                        <input
                            type="text"
                            name="title"
                            value={form.title}
                            onChange={
                                handleChange
                            }
                            disabled={saving}
                            required
                        />
                    </label>


                    <div className="form-two-column">

                        <label>
                            Date & time

                            <input
                                type="datetime-local"
                                name="dateTime"
                                value={form.dateTime}
                                onChange={
                                    handleChange
                                }
                                disabled={saving}
                                required
                            />
                        </label>


                        <label>
                            Category

                            <select
                                name="category"
                                value={form.category}
                                onChange={
                                    handleChange
                                }
                                disabled={saving}
                            >

                                {categories.map(
                                    (category) => (

                                        <option
                                            key={category}
                                            value={category}
                                        >
                                            {category}
                                        </option>

                                    )
                                )}

                            </select>

                        </label>

                    </div>


                    <div className="form-two-column">

                        <label>
                            Neighborhood / location

                            <input
                                name="location"
                                value={form.location}
                                onChange={
                                    handleChange
                                }
                                disabled={saving}
                                required
                            />
                        </label>


                        <label>
                            City

                            <input
                                name="city"
                                value={form.city}
                                onChange={
                                    handleChange
                                }
                                disabled={saving}
                                required
                            />
                        </label>

                    </div>


                    <label>
                        Organizer

                        <input
                            name="organizerName"
                            value={
                                form.organizerName
                            }
                            onChange={
                                handleChange
                            }
                            disabled={saving}
                            required
                        />
                    </label>


                    <label>
                        Description

                        <textarea
                            name="description"
                            value={
                                form.description
                            }
                            onChange={
                                handleChange
                            }
                            rows={5}
                            disabled={saving}
                            required
                        />

                    </label>


                    <div className="form-actions">

                        <button
                            type="button"
                            className="secondary-button"
                            onClick={onClose}
                            disabled={saving}
                        >
                            Cancel
                        </button>


                        <button
                            type="submit"
                            className="primary-button"
                            disabled={saving}
                        >
                            {saving
                                ? "Saving..."
                                : "Save Changes"}
                        </button>

                    </div>

                </form>

            </div>

        </div>

    );
}