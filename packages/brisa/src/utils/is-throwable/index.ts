import { isNavigateThrowable } from '@/utils/navigate/utils';
import { isNotFoundError } from '@/utils/not-found';
import { isRerenderThrowable } from '@/utils/rerender-in-action';

export default function isThrowable(error: Error) {
  return (
    isRerenderThrowable(error) ||
    isNavigateThrowable(error) ||
    isNotFoundError(error)
  );
}

isThrowable.rerender = isRerenderThrowable;
isThrowable.navigate = isNavigateThrowable;
isThrowable.notFound = isNotFoundError;
