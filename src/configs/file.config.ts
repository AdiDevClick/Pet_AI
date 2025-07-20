/**
 * Configuration for files upload
 */

/** File size limits */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Accepted MIME image types for file upload */
export const ACCEPTED_FILE_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/jpg',
];

/** Error message for file size limit exceeded */
export const FILE_SIZE_LIMIT_EXCEEDED_ERROR = `Le fichier dépasse la taille maximale autorisée de ${
    MAX_FILE_SIZE / (1024 * 1024)
} Mo.`;

/** Error message for unsupported file MIME type */
export const FILE_MIME_NOT_ACCEPTED_ERROR =
    "Ce type de fichier n'est pas autorisé, veuillez n'utiliser que des .JPEG, .JPG ou .PNG";
