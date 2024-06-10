const template = {
    who: "Our buyers(s) are [Who Level 1] with [Who Level 2].",
    where: "Who boat on [Where Level 1], specially [Where Level 2].",
    activities: "Who also enjoy [Activities Level 1], including [Activities Level 2].",
    prioritize: "They prioritize [Prioritize Level 1]."
};

export default template;

export const templete2 = (queryItem: string): string => {
    return `Can you tell me 5 unique attribute of a ${queryItem}`
}

export const templete3 = (queryItem: string): string => {
    return `Can you give an walk around of a ${queryItem} broken out into headings of areas of the boat, ordered in a way that makes sense for giving a tour to a prospective buyer?`
}