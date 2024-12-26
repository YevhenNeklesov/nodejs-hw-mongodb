import { ContactsCollection } from '../db/models/contacts.js';
import { calculatePaginationData } from '../utils/calculatePaginationData.js';
import { SORT_ORDER } from '../constants/index.js';

export const getAllContacts = async ({
  userId,
  page = 1,
  perPage = 10,
  sortOrder = SORT_ORDER.ASC,
  sortBy = '_id',
  filter = {},
}) => {
  const limit = perPage;
  const skip = (page - 1) * perPage;

  const contactsQuery = ContactsCollection.find(userId);

  if (filter.type) {
    contactsQuery.where('contactType').equals(filter.type);
  }

  const [contactsCount, contacts] = await Promise.all([
    ContactsCollection.find(userId).merge(contactsQuery).countDocuments(),
    contactsQuery
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .exec(),
  ]);

  const paginationData = calculatePaginationData(contactsCount, perPage, page);

  return {
    data: contacts,
    ...paginationData,
  };
};

export const getContactById = async (userId, contactId) => {
  const contact = await ContactsCollection.findById({ id: contactId, userId });
  return contact;
};

export const createContact = async (userId, payload) => {
  const contact = await ContactsCollection.create({ ...payload, userId });
  return contact;
};

export const deleteContact = async (userId, contactId) => {
  const contact = await ContactsCollection.findOneAndDelete({
    _id: contactId,
    userId,
  });
  return contact;
};

export const updateContact = async (
  userId,
  contactId,
  payload,
  options = {},
) => {
  const rawResults = await ContactsCollection.findOneAndUpdate(
    { _id: contactId, userId },
    payload,
    {
      new: true,
      includeResultMetadata: true,
      ...options,
    },
  );
  if (!rawResults || !rawResults.value) {
    return null;
  }
  return {
    contact: rawResults.value,
    isNew: Boolean(rawResults?.lastErrorObject?.upserted),
  };
};
