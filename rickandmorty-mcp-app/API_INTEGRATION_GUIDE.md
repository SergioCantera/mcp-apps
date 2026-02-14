# Rick and Morty API Integration Guide

## API Description

The Rick and Morty API is a free, public REST API that provides access to information about characters, locations, and episodes from the animated series "Rick and Morty".

**Key Features:**

- ✅ No authentication required
- ✅ No API key needed
- ✅ No rate limiting for moderate use
- ✅ RESTful and easy to use
- ✅ Well-structured and documented data

**Base URL:** `https://rickandmortyapi.com/api`

**Official Documentation:** https://rickandmortyapi.com/documentation

---

## Configuration

### Environment Variables

The service uses the `API_BASE_URL` environment variable to configure the API base URL. If not specified, it uses the official URL by default.

`.env` file:

```env
API_BASE_URL=https://rickandmortyapi.com/api
```

### Installing Dependencies

This project uses native Node.js `fetch` (available in Node 18+) and `dotenv` to load environment variables:

```bash
npm install dotenv
```

---

## Service Structure

The service is located in `src/services/rickandmorty.ts` and provides the following interfaces and functions:

### Data Interfaces

#### Character

```ts
export interface Character {
  id: number;
  name: string;
  status: string; // "Alive", "Dead", "unknown"
  species: string;
  type: string;
  gender: string; // "Female", "Male", "Genderless", "unknown"
  origin: {
    name: string;
    url: string;
  };
  location: {
    name: string;
    url: string;
  };
  image: string; // URL to PNG image
  episode: string[]; // Array of episode URLs
  url: string; // Resource URL
  created: string; // Resource creation date
}
```

#### Location

```ts
export interface Location {
  id: number;
  name: string;
  type: string; // "Planet", "Space station", "Microverse", etc.
  dimension: string; // "Dimension C-500", "unknown", etc.
  residents: string[]; // Array of character resident URLs
  url: string;
  created: string;
}
```

#### Episode

```ts
export interface Episode {
  id: number;
  name: string;
  air_date: string; // Format: "December 9, 2013"
  episode: string; // Format: "S01E01"
  characters: string[]; // Array of character URLs
  url: string;
  created: string;
}
```

---

## Available Functions

### searchCharacter(name: string)

Search for a character by name and return the first matching result.

**Parameters:**

- `name` (string): Character name to search for

**Return:**

- `Promise<Character | null>`: Character object or `null` if not found

**Example:**

```ts
import { searchCharacter } from "./src/services/rickandmorty";

const character = await searchCharacter("Rick Sanchez");
if (character) {
  console.log(`${character.name} - ${character.status}`);
  console.log(`Location: ${character.location.name}`);
  console.log(`Image: ${character.image}`);
} else {
  console.log("Character not found");
}
```

**Endpoint used:**

```
GET /character/?name={name}
```

---

## Usage Examples

### Example 1: Search for Morty

```ts
const morty = await searchCharacter("Morty Smith");
console.log(morty);
// Output:
// {
//   id: 2,
//   name: "Morty Smith",
//   status: "Alive",
//   species: "Human",
//   ...
// }
```

### Example 2: Handle character not found

```ts
const unknown = await searchCharacter("Non-Existent Character");
if (!unknown) {
  console.log("Character does not exist in the API");
}
```

### Example 3: Access character properties

```ts
const rick = await searchCharacter("Rick");
if (rick) {
  // Access location
  console.log(`${rick.name} is at: ${rick.location.name}`);

  // Access origin
  console.log(`Origin: ${rick.origin.name}`);

  // Count episodes
  console.log(`Appearances: ${rick.episode.length} episodes`);

  // Access image
  console.log(`Image: ${rick.image}`);
}
```

---

## Extending the Service

You can extend the `rickandmorty.ts` service by adding more functions to access other endpoints:

### Get Character by ID

```ts
export async function getCharacterById(id: number): Promise<Character | null> {
  const response = await fetch(`${API_BASE_URL}/character/${id}`);
  if (!response.ok) return null;
  return response.json();
}
```

### Get Multiple Characters

```ts
export async function getCharactersByIds(ids: number[]): Promise<Character[]> {
  const response = await fetch(`${API_BASE_URL}/character/${ids.join(",")}`);
  const data = await response.json();
  return Array.isArray(data) ? data : [data];
}
```

### Get All Locations

```ts
export async function getAllLocations(): Promise<Location[]> {
  const response = await fetch(`${API_BASE_URL}/location`);
  const data = await response.json();
  return data.results || [];
}
```

### Get All Episodes

```ts
export async function getAllEpisodes(): Promise<Episode[]> {
  const response = await fetch(`${API_BASE_URL}/episode`);
  const data = await response.json();
  return data.results || [];
}
```

---

## Available API Endpoints

The Rick and Morty API provides the following endpoints:

| Endpoint                 | Description                          |
| ------------------------ | ------------------------------------ |
| `/character`             | Get all characters (with pagination) |
| `/character/:id`         | Get a specific character             |
| `/character/:id,:id`,... | Get multiple characters              |
| `/location`              | Get all locations                    |
| `/location/:id`          | Get a specific location              |
| `/episode`               | Get all episodes                     |
| `/episode/:id`           | Get a specific episode               |

For more details, refer to the [official documentation](https://rickandmortyapi.com/documentation).

---

## Important Notes

1. **No Authentication:** You don't need API keys or tokens. Requests are public.

2. **Rate Limiting:** Although there are no formal limits, it's recommended to use responsibly.

3. **Pagination:** The API returns paginated results (20 results per page by default) for list endpoints. It includes `info` metadata in the response.

4. **Caching:** Consider implementing caching in production to reduce API requests.

5. **Error Handling:** Always verify the response is valid before accessing data.

---

## Useful Resources

- [Official Documentation](https://rickandmortyapi.com/documentation)
- [GraphQL Alternative](https://rickandmortyapi.com/) - The API also offers a GraphQL endpoint
- [Project GitHub](https://github.com/afuh/rick-and-morty-api)

---

## Troubleshooting

### Error: "Cannot find module 'dotenv'"

**Solution:** Install dependencies with `npm install`

### 404 Error in Search

**Solution:** Verify that the character name is valid. The search is case-insensitive but must partially match the actual name.

### Null Response with Valid Requests

**Solution:** Check that `API_BASE_URL` is configured correctly. If using `localhost`, ensure the server is running.

---

## Changelog

- **v1.0** - Initial integration with `searchCharacter()` function
