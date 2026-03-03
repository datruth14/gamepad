import mongoose from 'mongoose';

export interface BotProfile {
    userId: mongoose.Types.ObjectId;
    fullName: string;
    unlockCode: string;
    isBot: boolean;
}

const BOTS: Omit<BotProfile, 'userId' | 'unlockCode'>[] = [
    { fullName: "Oluwaseun Adeyemi", isBot: true },
    { fullName: "Chinonso Okoro", isBot: true },
    { fullName: "Amina Ibrahim", isBot: true },
    { fullName: "Babajide Soyinka", isBot: true },
    { fullName: "Nneka Nwosu", isBot: true },
    { fullName: "Tunde Balogun", isBot: true },
    { fullName: "Zainab Musa", isBot: true },
    { fullName: "Femi Akindele", isBot: true },
    { fullName: "Chidi Anyanwu", isBot: true },
    { fullName: "Aisha Yusuf", isBot: true },
    { fullName: "Emeka Obi", isBot: true },
    { fullName: "Hadiza Bello", isBot: true },
    { fullName: "Kelechi Iheanacho", isBot: true },
    { fullName: "Fatima Abubakar", isBot: true },
    { fullName: "Segun Arinze", isBot: true },
    { fullName: "Ifeanyi Ezennaya", isBot: true },
    { fullName: "Maryam Sani", isBot: true },
    { fullName: "Damilola Oke", isBot: true },
    { fullName: "Uche Jombo", isBot: true },
    { fullName: "Yakubu Dogara", isBot: true },
    { fullName: "Bisi Adeleye", isBot: true },
    { fullName: "Kunle Afolayan", isBot: true },
    { fullName: "Blessing Okagbare", isBot: true },
    { fullName: "Ahmed Musa", isBot: true },
    { fullName: "Genevieve Nnaji", isBot: true },
    { fullName: "Patience Ozokwor", isBot: true },
    { fullName: "John Mikel Obi", isBot: true },
    { fullName: "Tiwa Savage", isBot: true },
    { fullName: "Wizkid Balogun", isBot: true },
    { fullName: "Davido Adeleke", isBot: true },
    { fullName: "Burna Boy", isBot: true },
    { fullName: "Don Jazzy", isBot: true },
    { fullName: "Olamide Adedeji", isBot: true },
    { fullName: "Phyno Azubuike", isBot: true },
    { fullName: "Yemi Alade", isBot: true },
    { fullName: "Simi Kosoko", isBot: true },
    { fullName: "Falz Egwuekwe", isBot: true },
    { fullName: "Mr Eazi", isBot: true },
    { fullName: "Rema Ikubese", isBot: true },
    { fullName: "Fireboy DML", isBot: true },
    { fullName: "Tems Openiyi", isBot: true },
    { fullName: "Asake Ahmed", isBot: true },
    { fullName: "Ayra Starr", isBot: true },
    { fullName: "Joeboy Akinfenwa", isBot: true },
    { fullName: "Ckay Kasari", isBot: true },
    { fullName: "Oxlad Olaitan", isBot: true },
    { fullName: "Zlatan Ibile", isBot: true },
    { fullName: "Naira Marley", isBot: true },
    { fullName: "Bella Shmurda", isBot: true },
    { fullName: "Mohbad Ileri", isBot: true },
    { fullName: "Victony Anthony", isBot: true },
    { fullName: "Rugert D'Prince", isBot: true },
    { fullName: "Blaqbonez Akumefule", isBot: true },
    { fullName: "Ladipoe Eso", isBot: true },
    { fullName: "Buju Benson", isBot: true },
    { fullName: "Zinoleesky Oniyide", isBot: true },
    { fullName: "Seyi Vibez", isBot: true },
    { fullName: "Portable Zazu", isBot: true },
    { fullName: "Odumodublvck", isBot: true },
    { fullName: "Shallipopi", isBot: true },
    { fullName: "Spyro Oludare", isBot: true },
    { fullName: "Kizz Daniel", isBot: true },
    { fullName: "Tekno Miles", isBot: true },
    { fullName: "Patoranking Okolie", isBot: true },
    { fullName: "Timaya Odon", isBot: true },
    { fullName: "Flavour N'abania", isBot: true },
    { fullName: "Duncan Mighty", isBot: true },
    { fullName: "KCee Okonkwo", isBot: true },
    { fullName: "Harrysong Luluz", isBot: true },
    { fullName: "Reekado Banks", isBot: true },
    { fullName: "Korede Bello", isBot: true },
    { fullName: "D'banj Oyebanjo", isBot: true },
    { fullName: "2Baba Idibia", isBot: true },
    { fullName: "P-Square Okoye", isBot: true },
    { fullName: "9ice Akande", isBot: true },
    { fullName: "Oritse Femi", isBot: true },
    { fullName: "Pasuma Alabi", isBot: true },
    { fullName: "Saheed Osupa", isBot: true },
    { fullName: "Kwam 1 Ayinde", isBot: true },
    { fullName: "Obesere Abass", isBot: true },
    { fullName: "M.I Abaga", isBot: true },
    { fullName: "Ice Prince Zamani", isBot: true },
    { fullName: "Jesse Jagz", isBot: true },
    { fullName: "Banky W", isBot: true },
    { fullName: "Skales Raoul", isBot: true },
    { fullName: "Shaydee Folarin", isBot: true },
    { fullName: "Niyola Eniola", isBot: true },
    { fullName: "Reminisce Safin", isBot: true },
    { fullName: "Lord of Ajasa", isBot: true },
    { fullName: "Da Grin Olaniyi", isBot: true },
    { fullName: "Vector Tha Viper", isBot: true },
    { fullName: "Illbliss Ejiofor", isBot: true },
    { fullName: "Naeto C", isBot: true },
    { fullName: "Ikechukwu Killz", isBot: true },
    { fullName: "Sasha P", isBot: true },
    { fullName: "Bouqui Bukola", isBot: true },
    { fullName: "Mo'Cheddah", isBot: true },
    { fullName: "Eva Alordiah", isBot: true },
    { fullName: "Blaise", isBot: true },
    { fullName: "Kemistry", isBot: true }
];

function generateUnlockCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export function getRandomBots(count: number): BotProfile[] {
    const shuffled = [...BOTS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).map(bot => ({
        ...bot,
        userId: new mongoose.Types.ObjectId(),
        unlockCode: generateUnlockCode()
    }));
}
