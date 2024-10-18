import { LoremIpsum } from "lorem-ipsum";

const lorem = new LoremIpsum();

const dict = {
    number: 'Math.floor(Math.random() * 100)',
    string: 'Lorem.generateWords(3)',
    boolean: 'Math.random() > 0.5',
    object: '({ lorem: Lorem.generateWords(1), ipsum: Lorem.generateWords(2) })', 
    array: 'Lorem.generateWords(3).split(" ")',
    any: 'Lorem.generateSentences(1)'
}

const funDict = {
    number: () => Math.floor(Math.random() * 100),
    string: () => lorem.generateWords(3),
    boolean: () => Math.random() > 0.5,
    object: () => ({ lorem: lorem.generateWords(1), ipsum: lorem.generateWords(2) }), 
    array: () => lorem.generateWords(3).split(" "),
    any: () => lorem.generateSentences(1)
}

const loremConvert = (data: { [key: string]: keyof typeof funDict }) => {
    const res: { [key: string]: any } = {}
    Object.keys(data).forEach(key => {
        res[key] = funDict[data[key]]()
    })
    return res
} 

type DictKey = keyof typeof dict;

const loremFunctions = (type: DictKey): string => dict[type]
  
export { loremFunctions, loremConvert }