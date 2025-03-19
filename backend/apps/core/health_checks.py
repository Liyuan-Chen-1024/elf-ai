"""Custom health check backends."""

from apps.core.logging import get_logger
from typing import Optional

from django.conf import settings

from health_check.contrib.redis.backends import RedisHealthCheck as BaseRedisHealthCheck
from redis import Redis
from redis.exceptions import ConnectionError, RedisError

logger = get_logger(__name__)


class RedisHealthCheck(BaseRedisHealthCheck):
    """Custom Redis health check that uses our Redis configuration."""

    def __init__(self):
        """Initialize the health check."""
        super().__init__()
        self.redis_url = getattr(settings, "REDIS_URL", "redis://redis:6379/0")
        self.timeout = getattr(settings, "HEALTH_CHECK", {}).get("REDIS_TIMEOUT", 2)

    def get_redis_connection(self) -> Optional[Redis]:
        """Get Redis connection using our configuration.

        Returns:
            Redis connection or None if connection fails
        """
        try:
            logger.debug(f"Attempting to connect to Redis at {self.redis_url}")
            return Redis.from_url(
                self.redis_url,
                socket_connect_timeout=self.timeout,
                socket_timeout=self.timeout,
                decode_responses=True,
            )
        except Exception as e:
            logger.error(f"Failed to create Redis connection: {str(e)}")
            self.add_error(f"Unable to create Redis connection: {str(e)}")
            return None

    def check_status(self) -> None:
        """Check Redis connection status."""
        redis = self.get_redis_connection()

        if redis is None:
            return

        try:
            logger.debug("Attempting Redis ping")
            response = redis.ping()
            if response:
                logger.debug("Redis ping successful")
            else:
                logger.error("Redis ping returned False")
                self.add_error("Redis ping failed")
        except ConnectionError as e:
            logger.error(f"Redis connection error: {str(e)}")
            self.add_error(f"Unable to connect to Redis: {str(e)}")
        except RedisError as e:
            logger.error(f"Redis error: {str(e)}")
            self.add_error(f"Redis error: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error during Redis ping: {str(e)}")
            self.add_error(f"Unexpected error: {str(e)}")
        finally:
            try:
                redis.close()
            except Exception as e:
                logger.warning(f"Error closing Redis connection: {str(e)}")
