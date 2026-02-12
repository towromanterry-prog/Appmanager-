export default class Tag {
  constructor({ id = null, name = '', color = '#808080' } = {}) {
    this.id = id;
    this.name = name;
    this.color = color;
  }

  clone() {
    return new Tag({ ...this });
  }
}

export const tagConverter = {
  toFirestore: (tag) => ({
    name: tag.name,
    color: tag.color
  }),
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return new Tag({ id: snapshot.id, ...data });
  }
};

