// 🔐 Load environment variables from .env (e.g., API_BASE_URL)
import 'dotenv/config';

const API_BASE_URL = process.env.API_BASE_URL || "https://rickandmortyapi.com/api";


//Interfaces
export interface Character {
  id: number;
  name: string;
  status: string;
  species: string;
  type: string;
  gender: string;
  origin: {
    name: string;
    url: string;
  };
  location: {
    name: string;
    url: string;
  };
  image: string;
  episode: string[];
  url: string;
  created: string;
}

export interface Location {
  id: number;
  name: string;
  type: string;
  dimension: string;
  residents: string[];
  url: string;
  created: string;
}

export interface Episode {
  id: number;
  name: string;
  air_date: string;
  episode: string;
  characters: string[];
  url: string;
  created: string;
}


// Get character by name 
export async function searchCharacter(name: string): Promise<Character | null> {
    const response = await fetch(API_BASE_URL + `/character/?name=${encodeURIComponent(name)}`);
  const data = await response.json();
  if (data.results && data.results.length > 0) {
    const character = data.results[0];
    return {
      id: character.id,
      name: character.name,
      status: character.status,
      species: character.species,
      type: character.type,
      gender: character.gender,
      origin: character.origin,
      location: character.location,
      image: character.image,
      episode: character.episode,
      url: character.url,
      created: character.created,
    };
  }
  return null;
}