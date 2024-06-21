const template = {
    who: "Our buyers(s) are [Who Level 1] with [Who Level 2].",
    where: "Who boat on [Where Level 1], specially [Where Level 2].",
    activities: "Who also enjoy [Activities Level 1], including [Activities Level 2].",
    prioritize: "They are focused on [Prioritize Level 1]."
};
 
export default template;
 
export const templete2 = (queryItem: string, queryBrand : string): string => {
    return `provide 5 diversified and specific Value props for a ${queryBrand} ${queryItem} with a informative title and a description of the value prop and why it's important to a buyer or unique to that model. We don't want any pricing or warranty information`
}
 
export const templete3 = (queryItem: string,queryBrand : string): string => {
    return `Provide a walk around of a ${queryBrand} ${queryItem} organized by 5 different sections of the boat such as Front of the Boat (Bow Area),Interior and Cockpit Area,Entertainment and Electronics, Aft of the Boat (Stern Area) and Engine and Construction, careful to not repeat similar features and touching on a variety of areas`
}