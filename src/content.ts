async function fetchICSDict(ics_url: string): Promise<Response> {
    const ics_dict: Response = await fetch(ics_url);
    return ics_dict;
}

export { fetchICSDict };