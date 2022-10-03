package jk.kamoru.flayground.base.advice;

import java.lang.reflect.Method;
import org.apache.commons.lang3.StringUtils;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;
import jk.kamoru.flayground.base.advice.TrackExecutionTime.LEVEL;
import lombok.extern.slf4j.Slf4j;

@Aspect
@Component
@Slf4j
public class ExecutionTimeAdvice {

  @Around("@annotation(jk.kamoru.flayground.base.advice.TrackExecutionTime)")
  public Object measureExecutionTime(ProceedingJoinPoint joinPoint) throws Throwable {
    long startTime = System.currentTimeMillis();
    Object proceed = joinPoint.proceed();
    long executionTime = System.currentTimeMillis() - startTime;

    MethodSignature methodSignature = (MethodSignature) joinPoint.getSignature();
    Method method = methodSignature.getMethod();
    TrackExecutionTime trackExecutionTime = method.getAnnotation(TrackExecutionTime.class);
    String description = StringUtils.defaultIfBlank(trackExecutionTime.message(), methodSignature.toShortString());
    LEVEL level = trackExecutionTime.level();

    if (level.equals(LEVEL.DEBUG)) {
      log.debug("{} -> {} ms", description, executionTime);
    } else if (level.equals(LEVEL.INFO)) {
      log.info("{} -> {} ms", description, executionTime);
    } else if (level.equals(LEVEL.WARN)) {
      log.warn("{} -> {} ms", description, executionTime);
    } else if (level.equals(LEVEL.ERROR)) {
      log.error("{} -> {} ms", description, executionTime);
    }

    return proceed;
  }

}
