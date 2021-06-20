package jk.kamoru.flayground.base.web.security;

import java.io.IOException;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Enumeration;
import java.util.List;
import java.util.stream.Collectors;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class LocalAuthenticationFilter extends OncePerRequestFilter {

	private final static String LOCAL_NAME = "admin";
	private final static String LOCAL_PASS = "local";
	private final static Collection<? extends GrantedAuthority> LOCAL_AUTHORITIES = Arrays.stream(new String[] { "ROLE_ADMIN", "ROLE_USER" }).map(SimpleGrantedAuthority::new).collect(Collectors.toList());

	private static List<String> serverIPs = new ArrayList<>();

	static {
		serverIPs.add("localhost");
		try {
			Enumeration<NetworkInterface> networkInterfaces = NetworkInterface.getNetworkInterfaces();
			while (networkInterfaces.hasMoreElements()) {
				NetworkInterface networkInterface = networkInterfaces.nextElement();
				log.debug(String.format("NetworkInterface: %-5s %-4s %-8s %-7s %-50s",
						networkInterface.getName(),
						networkInterface.isUp() ? "up" : "down",
						networkInterface.isLoopback() ? "loopback" : "",
						networkInterface.isVirtual() ? "virtual" : "",
						networkInterface.getDisplayName()));

				if (networkInterface.isUp()) {
					System.out.println();
					System.out.format("\t NetworkInterface: %-5s [%s]%n", networkInterface.getName(), networkInterface.getDisplayName());

					Enumeration<InetAddress> inetAddresses = networkInterface.getInetAddresses();
					while (inetAddresses.hasMoreElements()) {
						InetAddress inetAddress = inetAddresses.nextElement();

						// interface is up and not loopback, inetaddress is SiteLocal
						if (networkInterface.isUp() && (networkInterface.isLoopback() || inetAddress.isSiteLocalAddress())) {
							serverIPs.add(inetAddress.getHostAddress());
						}

						System.out.format("\t    └ InetAddress: %-9s %-15s %s%n",
								inetAddress.isLoopbackAddress() ? "Loopback" : inetAddress.isLinkLocalAddress() ? "LinkLocal" : inetAddress.isSiteLocalAddress() ? "SiteLocal" : "unknown",
								inetAddress.getHostName(),
								inetAddress.getHostAddress());
					}
				}
			}
			System.out.println();
		} catch (SocketException e) {
			log.error("Fail to obtain System Ip", e);
		}
		log.info("Server IP is {}", serverIPs);
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws IOException, ServletException {
		if (SecurityContextHolder.getContext().getAuthentication() == null) {
			String remoteAddr = request.getRemoteAddr();
			log.info("New IP is Connected. {}", remoteAddr);

			if (serverIPs.contains(remoteAddr)) {
				UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(new User(LOCAL_NAME, LOCAL_PASS, LOCAL_AUTHORITIES), LOCAL_PASS, LOCAL_AUTHORITIES);
				authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
				log.debug("authentication {}", authentication);

				SecurityContextHolder.getContext().setAuthentication(authentication);
				log.info("{} is logged in {}", remoteAddr, LOCAL_NAME);
			}
		}
		chain.doFilter(request, response);
	}

}
