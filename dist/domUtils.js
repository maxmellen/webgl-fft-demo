export function $$$(ctor, id) {
    let element = document.getElementById(id);
    if (element instanceof ctor)
        return element;
    throw new Error(`Could not find ${ctor.name} by id "${id}"`);
}
