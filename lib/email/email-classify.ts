//first work here to know what priorty we have
//we have need-action,improtant,low-priority
export type EmailPriority=|"need-action"|"important"|"low-priority";
export interface EmailInput{
    subject:string|undefined;
    
    snippet:string|undefined;

    labels:string[]|undefined;
  
}
export function classifyEmail(email:EmailInput):EmailPriority{
    const text=`${email.subject?? ""} 
    ${email.snippet?? ""}`.toLowerCase();
    const label=email.labels?? [];
    if(label.includes("CATEGORY_PERMOTION")||label.includes("CATEGORY_SOCIAL")){
        return "low-priority"
    }
    const actionkeywords=["meeting",

    "interview",

    "schedule",

    "call",

    "reply",

    "respond",

    "deadline",

    "urgent",

    "review",

    "approval"];
//remember some is used to check if any of the keywords are present in the text
    if(actionkeywords.some(keyword=>text.includes(keyword))){
        return "need-action"
    }


return "important"
}