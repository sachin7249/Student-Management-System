
📦 API Endpoints
1. Add School
    URL: /addSchool
    Method: POST

    Body Parameters:

        - name: string
        - address: string
        - latitude: float
        - longitude: float

    Functionality: Adds a new school after validating inputs.

2. List Schools by Proximity
    URL: /listSchools

    Method: GET

    Query Parameters:

        - latitude: float (user location)
        - longitude: float (user location)

    Functionality: Returns a list of all schools, sorted by distance from the given location.
