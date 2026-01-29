export interface HauCharacter {
    id: string;
    name: string;
    description: string;
    personality: string;
    greeting: string;
    color: string;
}

export const HAU_CHARACTERS: HauCharacter[] = [
    {
        id: 'rizzo',
        name: 'Rizzo',
        description: 'An alien dog who escaped from a lab in NY! He is very talkative and loves sardines.',
        personality: 'Energetic and curious',
        greeting: "Woof! I mean... Greetings, humans! I'm so excited to deliver your messages!",
        color: '#7dd3fc'
    },
    {
        id: 'mochi',
        name: 'Mochi',
        description: 'A sleepy cloud spirit from the mountains of Japan. Moves slow but always arrives on time.',
        personality: 'Calm and reliable',
        greeting: 'Zzz... Oh! A delivery? I was just resting my eyes. Your messages are safe with me.',
        color: '#fda4af'
    },
    {
        id: 'pip',
        name: 'Pip',
        description: 'A tiny postal fairy who got lost in the human world. Collects stamps and shiny things.',
        personality: 'Cheerful and mischievous',
        greeting: 'Ooh, new friends! I promise not to peek at your letters... maybe just a little!',
        color: '#a5f3fc'
    },
    {
        id: 'grumble',
        name: 'Grumble',
        description: 'A grumpy rock golem who secretly loves his job. Pretends not to care but always delivers.',
        personality: 'Gruff but dependable',
        greeting: "Hmph. Another delivery job. Fine, I'll make sure it gets there. Don't expect me to smile about it.",
        color: '#d4d4d8'
    },
    {
        id: 'luna',
        name: 'Luna',
        description: 'A moth messenger who only works at night. Drawn to heartfelt messages like a flame.',
        personality: 'Mysterious and poetic',
        greeting: 'Your words glow so bright... I will carry them through the darkness.',
        color: '#c4b5fd'
    },
    {
        id: 'bento',
        name: 'Bento',
        description: 'A food-obsessed hamster who stores messages in his cheeks. Very professional about it.',
        personality: 'Hungry and hardworking',
        greeting: 'Got any snacks? No? Well, your message looks delicious—I mean, important!',
        color: '#fdba74'
    }
];

export function getRandomHauCharacter(): HauCharacter {
    const index = Math.floor(Math.random() * HAU_CHARACTERS.length);
    return HAU_CHARACTERS[index];
}

export function getHauCharacterById(id: string): HauCharacter | undefined {
    return HAU_CHARACTERS.find(h => h.id === id);
}

export function getHauCharacterByIdOrDefault(id: string): HauCharacter {
    return getHauCharacterById(id) || HAU_CHARACTERS[0];
}
