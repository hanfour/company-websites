import Link from 'next/link';

export default function Footer() {
  return (
    <div className="w-full mx-auto pt-24 pb-12 bg-[#fcfcfc]">
      <div className="flex flex-col items-center justify-center w-full pt-3 md:pt-5">
        <Link href="/contact_us" className="btn-contact">
          <span>CONTACT US</span>
        </Link>
      </div>
      <div className="w-full text-center pb-3 md:pb-5 mt-4">
        <small className="text-gray-600">
          <a
            href="tel:0225223181"
            className="block md:inline mb-2 md:mb-0 no-underline text-gray-600 hover:text-[var(--main-color)]"
          >
            ．T+ (02)25223181
          </a>
          <span className="hidden md:inline mx-2">．F+ (02)25813549</span>
          <span className="block md:hidden">．F+ (02)25813549</span>
          <a
            href="https://goo.gl/maps/2VuYZysSii23qgLp9"
            target="_blank"
            rel="noreferrer noopener"
            className="block md:inline mb-2 md:mb-0 no-underline text-gray-600 hover:text-[var(--main-color)]"
          >
            ．104台北市中山區松江路82號3樓
          </a>
        </small>
      </div>
    </div>
  );
}
