import { isNavigateThrowable } from '@/utils/navigate/utils';
import { isNotFoundError } from '@/utils/not-found';
import { isRerenderThrowable } from '@/utils/rerender-in-action/is-rerender-throwable';

function isThrowable(error: unknown) {
  return (
    isRerenderThrowable(error) ||
    isNavigateThrowable(error) ||
    isNotFoundError(error)
  );
}

const throwable = {
  is: isThrowable,
  isRerender: isRerenderThrowable,
  isNavigate: isNavigateThrowable,
  isNotFound: isNotFoundError,
};

export default throwable;
